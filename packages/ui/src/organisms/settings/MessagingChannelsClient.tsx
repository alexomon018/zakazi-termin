"use client";

import { trpc } from "@/lib/trpc/client";
import type { RouterOutputs } from "@salonko/trpc";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@salonko/ui";
import { AlertCircle, Check, Copy, MessageCircle, Phone, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type ChannelPlatform = "whatsapp" | "viber";

type MessagingChannelListItem = RouterOutputs["messagingChannel"]["list"][number];

interface MessagingChannelsClientProps {
  /** App origin (e.g. https://zakazi-termin.rs) used to render webhook URLs. */
  appOrigin: string;
}

export function MessagingChannelsClient({ appOrigin }: MessagingChannelsClientProps) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.messagingChannel.list.useQuery();
  const channels: MessagingChannelListItem[] = data ?? [];
  const [addOpen, setAddOpen] = useState<ChannelPlatform | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteChannel = trpc.messagingChannel.delete.useMutation({
    onSuccess: async () => {
      setDeleteError(null);
      await utils.messagingChannel.list.invalidate();
      setDeleteId(null);
    },
    onError: (error) => {
      setDeleteError(error.message);
    },
  });

  const whatsAppWebhookUrl = `${appOrigin}/api/messaging/whatsapp`;

  return (
    <div className="space-y-6 md:px-0" data-testid="messaging-channels">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Messaging kanali</h1>
        <p className="mt-1 text-muted-foreground">
          Povežite WhatsApp i Viber naloge sa vašim salonom kako bi AI asistent mogao da komunicira
          sa klijentima.
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => setAddOpen("whatsapp")} data-testid="add-whatsapp-channel">
          <Plus className="mr-2 w-4 h-4" />
          Poveži WhatsApp
        </Button>
        <Button
          onClick={() => setAddOpen("viber")}
          variant="secondary"
          data-testid="add-viber-channel"
        >
          <Plus className="mr-2 w-4 h-4" />
          Poveži Viber
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Učitavanje...</p>
      ) : channels.length === 0 ? (
        <div
          className="p-6 text-center rounded-lg border border-dashed border-border"
          data-testid="channels-empty"
        >
          <p className="text-muted-foreground">Još nemate povezanih kanala.</p>
        </div>
      ) : (
        <ul className="space-y-3" data-testid="channels-list">
          {channels.map((channel) => (
            <ChannelRow
              key={channel.id}
              channel={channel}
              appOrigin={appOrigin}
              onDelete={() => {
                deleteChannel.reset();
                setDeleteError(null);
                setDeleteId(channel.id);
              }}
            />
          ))}
        </ul>
      )}

      <AddChannelDialog
        platform={addOpen}
        appOrigin={appOrigin}
        whatsAppWebhookUrl={whatsAppWebhookUrl}
        onClose={() => setAddOpen(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteId(null);
            setDeleteError(null);
            deleteChannel.reset();
          }
        }}
        title="Ukloni kanal"
        description="Da li ste sigurni da želite da uklonite ovaj kanal? Klijenti više neće moći da komuniciraju sa vašim botom."
        confirmText="Ukloni"
        loadingText="Uklanjanje..."
        isLoading={deleteChannel.isPending}
        errorMessage={deleteError ?? deleteChannel.error?.message}
        onConfirm={() => {
          if (!deleteId) return;
          setDeleteError(null);
          deleteChannel.reset();
          deleteChannel.mutate({ id: deleteId });
        }}
      />
    </div>
  );
}

interface ChannelRowProps {
  channel: MessagingChannelListItem;
  appOrigin: string;
  onDelete: () => void;
}

function ChannelRow({ channel, appOrigin, onDelete }: ChannelRowProps) {
  const webhookUrl = useMemo(() => {
    if (channel.platform === "viber") {
      return `${appOrigin}/api/messaging/viber/${channel.externalId}`;
    }
    return `${appOrigin}/api/messaging/whatsapp`;
  }, [appOrigin, channel.platform, channel.externalId]);

  const Icon = channel.platform === "viber" ? MessageCircle : Phone;
  const label = channel.platform === "viber" ? "Viber" : "WhatsApp";

  return (
    <li className="flex gap-4 justify-between items-start p-4 rounded-lg border border-border bg-card">
      <div className="flex gap-3 flex-1 min-w-0">
        <Icon className="w-5 h-5 mt-1 text-muted-foreground shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <p className="font-medium">{label}</p>
            <p className="text-xs text-muted-foreground truncate">
              {channel.platform === "viber"
                ? channel.botName || "Bez imena"
                : `Phone ID: ${channel.externalId}`}
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Webhook URL</Label>
            <CopyableUrl url={webhookUrl} />
          </div>
        </div>
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={onDelete}
        aria-label="Ukloni kanal"
        data-testid={`delete-channel-${channel.id}`}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </li>
  );
}

function CopyableUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const handleCopy = async () => {
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL to clipboard:", err);
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2000);
    }
  };
  return (
    <div className="flex gap-2 items-center">
      <code className="flex-1 p-2 text-xs truncate rounded bg-muted font-mono">{url}</code>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={handleCopy}
        aria-label="Kopiraj URL"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : copyFailed ? (
          <AlertCircle className="w-4 h-4 text-destructive" aria-hidden="true" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}

interface AddChannelDialogProps {
  platform: ChannelPlatform | null;
  appOrigin: string;
  whatsAppWebhookUrl: string;
  onClose: () => void;
}

function AddChannelDialog({
  platform,
  appOrigin,
  whatsAppWebhookUrl,
  onClose,
}: AddChannelDialogProps) {
  const utils = trpc.useUtils();
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [whatsAppAccessToken, setWhatsAppAccessToken] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [botName, setBotName] = useState("");

  const resetForm = () => {
    setPhoneNumberId("");
    setWhatsAppAccessToken("");
    setAuthToken("");
    setBotName("");
  };

  const createWhatsApp = trpc.messagingChannel.createWhatsApp.useMutation({
    onSuccess: async () => {
      await utils.messagingChannel.list.invalidate();
      resetAll();
      onClose();
    },
  });

  const createViber = trpc.messagingChannel.createViber.useMutation({
    onSuccess: async () => {
      await utils.messagingChannel.list.invalidate();
      resetAll();
      onClose();
    },
  });

  const resetAll = () => {
    resetForm();
    createWhatsApp.reset();
    createViber.reset();
  };

  const isPending = createWhatsApp.isPending || createViber.isPending;
  const error = createWhatsApp.error?.message || createViber.error?.message;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (platform === "whatsapp") {
      createWhatsApp.mutate({
        phoneNumberId: phoneNumberId.trim(),
        accessToken: whatsAppAccessToken.trim(),
      });
    } else if (platform === "viber") {
      createViber.mutate({
        authToken: authToken.trim(),
        botName: botName.trim() || undefined,
      });
    }
  };

  return (
    <Dialog
      open={platform !== null}
      onOpenChange={(open) => {
        if (!open) {
          resetAll();
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {platform === "viber" ? "Poveži Viber bot" : "Poveži WhatsApp broj"}
          </DialogTitle>
          <DialogDescription>
            {platform === "viber"
              ? "Unesite auth token vašeg Viber bota. Webhook URL će biti prikazan nakon povezivanja."
              : "Unesite WhatsApp phone_number_id iz Meta konzole."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {platform === "whatsapp" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                <Input
                  id="phoneNumberId"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  placeholder="npr. 123456789012345"
                  required
                  pattern="\d+"
                  data-testid="whatsapp-phone-number-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsAppAccessToken">Access token</Label>
                <Input
                  id="whatsAppAccessToken"
                  type="password"
                  value={whatsAppAccessToken}
                  onChange={(e) => setWhatsAppAccessToken(e.target.value)}
                  placeholder="System User token iz Meta konzole"
                  required
                  data-testid="whatsapp-access-token"
                />
                <p className="text-xs text-muted-foreground">
                  Meta Developer Console → WhatsApp → API Setup → System User token.
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Webhook URL (zajednički za sve WhatsApp brojeve)
                </Label>
                <CopyableUrl url={whatsAppWebhookUrl} />
              </div>
            </>
          )}

          {platform === "viber" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="viberAuthToken">Auth token</Label>
                <Input
                  id="viberAuthToken"
                  type="password"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="Viber bot auth token"
                  required
                  data-testid="viber-auth-token"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="viberBotName">Ime bota (opciono)</Label>
                <Input
                  id="viberBotName"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="npr. Booking Assistant"
                  data-testid="viber-bot-name"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Nakon povezivanja, dobićete jedinstven webhook URL (oblika{" "}
                <code>{appOrigin}/api/messaging/viber/&lt;channelId&gt;</code>) koji treba da
                unesete u Viber konzolu.
              </p>
            </>
          )}

          {error && (
            <div
              role="alert"
              className="flex gap-2 items-center p-3 rounded-md bg-destructive/10 border border-destructive/20"
            >
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                resetAll();
                onClose();
              }}
              disabled={isPending}
            >
              Otkaži
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Povezivanje..." : "Poveži"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
