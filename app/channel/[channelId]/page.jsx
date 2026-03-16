import { ChannelClient } from "./ChannelClient";

// Await params strictly required by Next.js 16
export default async function ChannelPage({ params }) {
  const { channelId } = await params;

  return (
    <div className="mx-auto max-w-[1600px] sm:px-6 lg:px-8 py-4 sm:py-6">
      <ChannelClient channelId={channelId} />
    </div>
  );
}