"use client";

import { useState } from "react";
import styles from "./follow-up.module.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

export function FollowUp({
  email,
  name,
  purchased,
}: {
  email: string;
  name: string;
  purchased: boolean;
}) {
  const [subject, setSubject] = useState(
    purchased
      ? "How is your Nyota invitation coming along?"
      : "Can I help with your Nyota invitation?",
  );
  const [body, setBody] = useState(
    `Hi ${name || "there"},\n\n${
      purchased
        ? "Thanks for choosing Nyota for your celebration. How is everything going? If you need a hand with your invitation, just reply."
        : "Thanks for trying Nyota. Was there anything that made it difficult to finish your invitation? I'd love to hear what was missing or help you get it ready."
    }\n\nWarmly,\nFeneel\nNyota\n\nIf you'd prefer no more follow-ups, please let me know.`,
  );
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Draft email
        </Button>
      </DialogTrigger>
      <DialogContent className={styles.dialog}>
        <DialogHeader>
          <DialogTitle className={styles.title}>A personal follow-up</DialogTitle>
          <DialogDescription>
            To {email}. Review your message, then send it from your email app.
          </DialogDescription>
        </DialogHeader>
        <label className="grid gap-2 text-sm">
          Subject
          <Input
            value={subject}
            maxLength={150}
            onChange={(e) => setSubject(e.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm">
          Message
          <Textarea
            rows={11}
            value={body}
            maxLength={3000}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <p className="text-sm text-muted-foreground">
          Email permission and opt-outs are not tracked here. Check your contact
          records before following up.
        </p>
        <Button asChild>
          <a
            href={`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
          >
            Open in email app
          </a>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
