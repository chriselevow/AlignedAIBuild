import Link from "next/link";
import useSWR from "swr";
import { getOgImageUrl } from "@/lib/utils";
import { ThumbsUp, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Spinner } from "@/components/ui/spinner";

interface GalleryItemWithUpvotes {
	sessionId: string;
	version: string;
	title: string;
	description: string;
	upvoteCount: number;
	createdAt: string;
}

interface GalleryListingProps {
	limit?: number;
	view?: "trending" | "popular" | "new";
}

export function GalleryListing({
	limit,
	view = "popular",
}: GalleryListingProps) {
	const { data: gallery, isLoading } = useSWR<GalleryItemWithUpvotes[]>(
		view ? `/api/apps?view=${view}` : null,
		async (url) => {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error("Failed to fetch gallery");
			}
			return response.json();
		},
		{
			revalidateOnFocus: false,
			dedupingInterval: 30000, // Match the server-side cache of 30 seconds
		},
	);

	if (isLoading) {
		return (
			<div className="text-center text-gray-500 py-8">
				<Spinner className="mx-auto" />
			</div>
		);
	}

	if (!gallery?.length) {
		return (
			<div className="text-center text-gray-500 py-8">
				{view === "trending"
					? "No trending apps in the last 24 hours"
					: "No apps found"}
			</div>
		);
	}

	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
			{(limit ? gallery.slice(0, limit) : gallery).map((item) => (
				<Link
					key={item.sessionId}
					href={`/apps/${item.sessionId}/${item.version}`}
					target="_blank"
					className="group flex flex-col rounded-xl overflow-hidden border border-border bg-card hover:border-groq hover:shadow-lg transition-all duration-200"
				>
					<div
						className="w-full aspect-square bg-muted bg-cover bg-center"
						style={{
							backgroundImage: `url(${getOgImageUrl(item.sessionId, item.version)})`,
						}}
					/>
					<div className="p-3 flex flex-col gap-1.5">
						<div className="flex justify-between items-start gap-2">
							<div className="font-medium text-sm leading-tight truncate flex-1 min-w-0" title={item.title}>
								{item.title}
							</div>
							<div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
								<ThumbsUp size={12} />
								<span>{item.upvoteCount}</span>
							</div>
						</div>
						<div className="text-xs text-muted-foreground line-clamp-2">
							{item.description}
						</div>
						<div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
							<Clock size={11} />
							<span>{formatDistanceToNow(new Date(item.createdAt))} ago</span>
						</div>
					</div>
				</Link>
			))}
		</div>
	);
}
