"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { 
  Send, 
  Search, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  FileText,
  ArrowRight,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export function TextLkMessages() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [templateId, setTemplateId] = useState("none");
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [fetchingLogs, setFetchingLogs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    if (!session) return;
    try {
      setFetchingLogs(true);
      const [tplRes, statsRes] = await Promise.all([
        fetch(`/api/text-lk/templates`, {
          headers: { Authorization: `Bearer internal` },
          cache: 'no-store'
        }),
        fetch(`/api/text-lk/stats`, {
          headers: { Authorization: `Bearer internal` },
          cache: 'no-store'
        })
      ]);

      const [tplData, statsData] = await Promise.all([
        tplRes.json(), statsRes.json()
      ]);

      if (tplData.status === 'success') {
        setTemplates(tplData.data || []);
      }
      if (statsData.status === 'success' && statsData.data) {
        setLogs(statsData.data.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch text.lk data", err);
    } finally {
      setFetchingLogs(false);
    }
  }, [session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSend = async () => {
    if (!recipient || !message) {
      toast.error("Please provide both recipient and message");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/text-lk/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer internal`
        },
        body: JSON.stringify({ recipient, message, template_id: templateId })
      });

      if (!response.ok) throw new Error("Failed to send message");
      toast.success("Message sent successfully!");
      setRecipient("");
      setMessage("");
      setTemplateId("none");
      fetchData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.to || log.recipient || "").toLowerCase().includes(q) ||
      (log.message || log.body || "").toLowerCase().includes(q) ||
      (log.status || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Composer */}
      <Card className="lg:col-span-1 border-border bg-card shadow-xs rounded-xl flex flex-col">
        <CardHeader className="border-b border-border bg-muted/30">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Compose SMS
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-5 flex-1">
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold text-foreground">Recipient Number</Label>
            <Input 
              placeholder="e.g. 947XXXXXXXX" 
              className="h-10 font-bold text-sm bg-muted/40 border-border text-foreground"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
            <p className="text-[9px] text-muted-foreground font-medium">Include country code (e.g. 94 for Sri Lanka)</p>
          </div>

          <div className="space-y-2">
            <Label className="text-[13px] font-semibold text-foreground">Quick Template</Label>
            <Select value={templateId} onValueChange={(val) => {
              setTemplateId(val);
              if (val === "none") {
                setMessage("");
              } else {
                const tpl = templates.find(t => t.id.toString() === val);
                if (tpl) setMessage(tpl.body || "");
              }
            }}>
              <SelectTrigger className="h-10 bg-muted/40 border-border text-sm text-foreground">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Custom Message</SelectItem>
                {templates.map(tpl => (
                  <SelectItem key={tpl.id} value={tpl.id.toString()}>{tpl.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[13px] font-semibold text-foreground">Message Body</Label>
            <Textarea 
              placeholder="Type your message here..." 
              className="min-h-[160px] bg-muted/40 border-border text-sm leading-relaxed text-foreground focus-visible:ring-indigo-500"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex justify-between items-center px-1">
              <span className={`text-[10px] font-bold ${message.length > 160 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                {message.length} / 160 characters
              </span>
              <span className="text-[10px] font-bold text-muted-foreground">
                {Math.ceil(message.length / 160)} SMS units
              </span>
            </div>
          </div>

          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 h-11 font-bold shadow-md shadow-indigo-500/20 dark:shadow-indigo-500/5 active:scale-95 transition-transform"
            onClick={handleSend}
            disabled={loading || !recipient || !message}
          >
            {loading ? <Clock className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send Message
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="lg:col-span-2 border-border bg-card shadow-xs rounded-xl flex flex-col">
        <CardHeader className="border-b border-border bg-card flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Message History
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input 
                placeholder="Search messages..." 
                className="h-8 pl-8 text-xs w-[160px] border-border bg-muted/40 text-foreground" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          <div className="divide-y divide-border/60">
            {fetchingLogs ? (
              <div className="p-4 space-y-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-3 w-full max-w-[200px]" />
                      <div className="flex gap-2 pt-1">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground font-medium text-xs">
                No message history available.
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground font-medium text-xs">
                No messages found matching "{searchQuery}".
              </div>
            ) : (
              filteredLogs.map((log, i) => {
                const isDelivered = log.status?.toLowerCase() === 'delivered';
                const isFailed = log.status?.toLowerCase() === 'failed';
                
                return (
                  <div key={i} className="p-4 hover:bg-muted/20 transition-colors cursor-pointer group">
                    <div className="flex items-start gap-4">
                      <div className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center border ${isDelivered ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : isFailed ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                        {isDelivered ? <CheckCircle2 className="h-5 w-5" /> : isFailed ? <XCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-foreground truncate mr-2">{log.to || log.recipient}</p>
                          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 shrink-0">
                            <Clock className="h-3 w-3" />
                            {log.sent_at ? new Date(log.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground/80 line-clamp-1 pr-12 leading-relaxed">{log.message || log.body}</p>
                        <div className="pt-1 flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border ${isDelivered ? 'border-emerald-500/30 text-emerald-600' : isFailed ? 'border-rose-500/30 text-rose-600' : 'border-amber-500/30 text-amber-600'}`}>
                            {log.status || 'Pending'}
                          </Badge>
                          <span className="text-[9px] font-bold text-muted-foreground/60">{log.cost || 1} Credit</span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {!fetchingLogs && filteredLogs.length > 0 && (
              <div className="p-8 text-center space-y-2">
                <p className="text-[11px] font-bold text-muted-foreground">End of message history</p>
                <Button variant="link" className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline h-auto p-0">Load older messages</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
