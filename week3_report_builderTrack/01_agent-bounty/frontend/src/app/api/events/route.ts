import { BackendError, getBackend } from 'agent-bounty-services';
import { actorFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const encoder = new TextEncoder();

export async function GET(request: Request) {
  const actor = actorFromRequest(request);
  if (!actor) return Response.json({ success: false, code: 'AUTH_REQUIRED', error: 'Sign in before subscribing to workspace events.' }, { status: 401 });
  const backend = await getBackend();
  let timer: ReturnType<typeof setInterval> | undefined;
  let closing: ReturnType<typeof setTimeout> | undefined;
  let busy = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        if (busy) return;
        busy = true;
        try {
          const snapshot = await backend.refresh();
          const sequence = snapshot.events[0]?.createdAt || Date.now();
          controller.enqueue(encoder.encode(`id: ${sequence}\nevent: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`));
        } catch (error) {
          const message = error instanceof BackendError ? error.code : 'EVENT_STREAM_STALE';
          controller.enqueue(encoder.encode(`event: warning\ndata: ${JSON.stringify({ code: message })}\n\n`));
        } finally { busy = false; }
      };
      await send();
      timer = setInterval(() => { void send(); }, 3_000);
      closing = setTimeout(() => { if (timer) clearInterval(timer); controller.close(); }, 55_000);
    },
    cancel() {
      if (timer) clearInterval(timer);
      if (closing) clearTimeout(closing);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
