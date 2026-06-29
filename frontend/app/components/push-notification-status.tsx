"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Flex } from "@radix-ui/themes";
import { Bell, BellOff } from "lucide-react";

import {
  getNotificationStatus,
  registerServiceWorker,
  requestPushSubscription,
  type PushStatus,
} from "@/lib/push-notifications";

const statusLabel: Record<PushStatus, string> = {
  unsupported: "Push недоступен",
  default: "Push выключен",
  denied: "Push запрещен",
  granted: "Push включен",
  subscribed: "Push активен",
};

export function PushNotificationStatus() {
  const [status, setStatus] = useState<PushStatus>("unsupported");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const currentStatus = getNotificationStatus();
    setStatus(currentStatus);

    if (currentStatus !== "unsupported") {
      void registerServiceWorker();
    }
  }, []);

  async function enablePush() {
    setSubmitting(true);

    try {
      const subscription = await requestPushSubscription();
      setStatus(subscription ? "subscribed" : getNotificationStatus());
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "unsupported" || status === "denied") {
    return (
      <Badge color="gray">
        <BellOff size={13} /> {statusLabel[status]}
      </Badge>
    );
  }

  if (status === "default") {
    return (
      <Button size="1" variant="soft" color="gray" onClick={enablePush} disabled={submitting}>
        <Bell size={13} /> Push
      </Button>
    );
  }

  return (
    <Flex align="center">
      <Badge color="green">
        <Bell size={13} /> {statusLabel[status]}
      </Badge>
    </Flex>
  );
}
