import prisma from '@/lib/prisma';

export const sendSms = async (recipient, message) => {
    try {
        if (!recipient || !message) {
            console.error('Text.lk: Recipient and message are required.');
            return false;
        }

        // Fetch settings
        const settings = await prisma.appSettings.findFirst();

        if (!settings || !settings.smsEnabled) {
            console.log('Text.lk: SMS is disabled in settings.');
            return false;
        }

        const apiKey = process.env.TEXTLK_API_KEY || settings.textLkApiKey;
        const senderId = process.env.TEXTLK_SENDER_ID || settings.textLkSenderId || 'Text.lk'; // Default fallback

        if (!apiKey) {
            console.warn('Text.lk: API key is missing in .env or settings. Cannot send SMS.');
            return false;
        }

        // Clean up recipient number
        // (Assuming SL number format +947XXXXXXXX or 07XXXXXXXX)
        let formattedRecipient = recipient.replace(/\D/g, ''); // Remove non-digits
        if (formattedRecipient.startsWith('0')) {
            formattedRecipient = '94' + formattedRecipient.substring(1);
        } else if (!formattedRecipient.startsWith('94') && formattedRecipient.length === 9) {
            formattedRecipient = '94' + formattedRecipient;
        }

        const payload = {
            recipient: formattedRecipient,
            sender_id: senderId,
            message: message,
            type: 'plain'
        };

        const response = await fetch('https://app.text.lk/api/v3/sms/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(15000)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error('Text.lk Send SMS Error Response:', data);
            throw new Error(data.message || 'Failed to send SMS');
        }

        console.log(`Text.lk: SMS sent successfully to ${formattedRecipient}`);
        return true;
    } catch (error) {
        console.error('Text.lk Send SMS Exception:', error.message);
        return false;
    }
};
