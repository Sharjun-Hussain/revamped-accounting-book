import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const TEXTLK_API_BASE = 'https://app.text.lk/api/v3';

async function getConfig() {
    const settings = await prisma.appSettings.findFirst();
    return {
        apiKey: (process.env.TEXTLK_API_KEY || settings?.textLkApiKey || '').trim() || null,
        senderId: (process.env.TEXTLK_SENDER_ID || settings?.textLkSenderId || 'Text.lk').trim(),
        enabled: settings?.smsEnabled !== undefined ? settings.smsEnabled : false
    };
}

async function fetchTextLk(path, options = {}) {
    const config = await getConfig();
    if (!config.apiKey) throw new Error('Text.lk API key is not configured');

    const headers = {
        'Authorization': `Bearer ${config.apiKey}`,
        'Accept': 'application/json',
        ...(options.headers || {})
    };

    if (options.body && typeof options.body === 'object') {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }

    const res = await fetch(`${TEXTLK_API_BASE}${path}`, { ...options, headers, cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Text.lk API error');
    return data;
}

export async function GET(req, { params }) {
    try {
        const paramsAwaited = await params;
        const route = paramsAwaited?.route || [];
        const path = route.join('/');

        if (path === 'config') {
            const config = await getConfig();
            if (config.apiKey) config.apiKey = '********';
            return NextResponse.json({ status: 'success', enabled: config.enabled, config });
        }

        if (path === 'stats') {
            try {
                const [balanceRes, logsRes] = await Promise.all([
                    fetchTextLk('/balance').catch(() => ({ data: { remaining_balance: '0' } })),
                    fetchTextLk('/sms?limit=100').catch(() => ({ data: { data: [] } }))
                ]);
                
                const balance = balanceRes?.data?.remaining_balance || '0';
                const logs = Array.isArray(logsRes?.data?.data) ? logsRes.data.data : (Array.isArray(logsRes?.data) ? logsRes.data : []);
                const delivered = logs.filter(l => l.status === 'Delivered').length;
                const failed = logs.filter(l => ['Failed', 'Undelivered', 'FailedToSend'].includes(l.status)).length;
                
                return NextResponse.json({
                    status: 'success',
                    data: {
                        balance,
                        totalSent: logs.length,
                        delivered,
                        failed,
                        logs: logs.slice(0, 10)
                    }
                });
            } catch (error) {
                return NextResponse.json({ status: 'success', data: { balance: 'N/A', totalSent: 0, delivered: 0, failed: 0, logs: [] } });
            }
        }

        if (path === 'contacts') {
            const data = await fetchTextLk('/contacts');
            return NextResponse.json({ status: 'success', data: data.data || [] });
        }

        if (path === 'templates') {
            const templates = await prisma.textLkTemplate.findMany({ where: { is_active: true } });
            return NextResponse.json({ status: 'success', data: templates });
        }

        if (path === 'campaigns') {
            const campaigns = await prisma.textLkCampaign.findMany({ orderBy: { createdAt: 'desc' } });
            return NextResponse.json({ status: 'success', data: campaigns });
        }

        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req, { params }) {
    try {
        const paramsAwaited = await params;
        const route = paramsAwaited?.route || [];
        const path = route.join('/');
        const body = await req.json().catch(() => ({}));

        if (path === 'config') {
            const settings = await prisma.appSettings.findFirst();
            const updateData = { textLkSenderId: body.senderId, smsEnabled: !!body.enabled };
            if (body.apiKey && body.apiKey !== '********') {
                updateData.textLkApiKey = body.apiKey;
            }
            if (settings) {
                await prisma.appSettings.update({ where: { id: settings.id }, data: updateData });
            } else {
                await prisma.appSettings.create({ data: updateData });
            }
            return NextResponse.json({ status: 'success', message: 'Saved' });
        }

        if (path === 'test') {
            await fetchTextLk('/contacts?limit=1');
            return NextResponse.json({ status: 'success', message: 'Connected' });
        }

        if (path === 'contacts') {
            const data = await fetchTextLk('/contacts', { method: 'POST', body: { name: body.name } });
            return NextResponse.json({ status: 'success', data });
        }

        if (path === 'sync') {
            const members = await prisma.member.findMany({ where: { status: 'active' } });
            if (!members.length) return NextResponse.json({ status: 'success', data: { synced: 0 } });
            
            const groupsRes = await fetchTextLk('/contacts');
            let group = (groupsRes.data || []).find(g => g.name === 'Mosque Members');
            if (!group) {
                const newGroup = await fetchTextLk('/contacts', { method: 'POST', body: { name: 'Mosque Members' } });
                group = newGroup.data;
            }

            let synced = 0;
            for (const m of members) {
                const phone = m.contact?.replace(/\D/g, '');
                if (phone) {
                    await fetchTextLk('/contacts/initialize', {
                        method: 'POST',
                        body: { first_name: m.name, last_name: '', phone, group_id: group.id }
                    }).catch(() => {});
                    synced++;
                }
            }
            return NextResponse.json({ status: 'success', data: { synced, failed: members.length - synced } });
        }

        if (path === 'send') {
            const config = await getConfig();
            const data = await fetchTextLk('/sms/send', {
                method: 'POST',
                body: { recipient: body.recipient, sender_id: config.senderId || 'Text.lk', message: body.message, template_id: body.template_id }
            });
            return NextResponse.json({ status: 'success', data });
        }

        if (path === 'templates') {
            const t = await prisma.textLkTemplate.create({ data: { name: body.name, body: body.body, dlt_template_id: body.dlt_template_id } });
            return NextResponse.json({ status: 'success', data: t });
        }

        if (path === 'campaigns') {
            const config = await getConfig();
            const c = await prisma.textLkCampaign.create({
                data: {
                    name: body.name, message: body.message, contact_list_id: body.contact_list_id,
                    dlt_template_id: body.dlt_template_id, schedule_time: body.schedule_time ? new Date(body.schedule_time) : null
                }
            });
            const result = await fetchTextLk('/sms/campaign', {
                method: 'POST',
                body: {
                    contact_list_id: body.contact_list_id, sender_id: config.senderId || 'Text.lk', type: 'plain',
                    message: body.message, dlt_template_id: body.dlt_template_id, schedule_time: body.schedule_time
                }
            });
            await prisma.textLkCampaign.update({ where: { id: c.id }, data: { status: body.schedule_time ? 'Scheduled' : 'Sent', response_data: result } });
            return NextResponse.json({ status: 'success', data: c });
        }

        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    try {
        const paramsAwaited = await params;
        const route = paramsAwaited?.route || [];
        const body = await req.json().catch(() => ({}));
        if (route[0] === 'contacts' && route[1]) {
            const data = await fetchTextLk(`/contacts/${route[1]}`, { method: 'PATCH', body: { name: body.name } });
            return NextResponse.json({ status: 'success', data });
        }
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const paramsAwaited = await params;
        const route = paramsAwaited?.route || [];
        if (route[0] === 'contacts' && route[1]) {
            const data = await fetchTextLk(`/contacts/${route[1]}`, { method: 'DELETE' });
            return NextResponse.json({ status: 'success', data });
        }
        if (route[0] === 'templates' && route[1]) {
            await prisma.textLkTemplate.update({ where: { id: route[1] }, data: { is_active: false } });
            return NextResponse.json({ status: 'success' });
        }
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
