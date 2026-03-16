// import { formatTimeAgo } from "@/lib/formatters";
// import { ThumbsUp, ThumbsDown } from "lucide-react";
// import { Button } from "../ui/Button";

// export function CommentItem({ comment }) {
//   return (
//     <div className="flex gap-4 text-sm">
//       {/* Avatar */}
//       <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--surface-raised)]">
//         <img
//           src={comment.owner?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"}
//           alt={comment.owner?.username}
//           className="h-full w-full object-cover"
//         />
//       </div>

//       {/* Content */}
//       <div className="flex flex-col gap-1">
//         <div className="flex items-center gap-2">
//           <span className="font-semibold text-[var(--text-primary)]">
//             @{comment.owner?.username}
//           </span>
//           <span className="text-xs text-[var(--text-muted)]">
//             {formatTimeAgo(comment.createdAt)}
//           </span>
//         </div>
        
//         <p className="text-[var(--text-primary)] whitespace-pre-wrap">{comment.content}</p>

//         {/* Action Buttons */}
//         <div className="flex items-center gap-2 mt-1">
//           <Button variant="ghost" size="sm" className="h-8 px-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
//             <ThumbsUp className="h-4 w-4 mr-1.5" />
//             <span className="text-xs">{comment.likes || 0}</span>
//           </Button>
//           <Button variant="ghost" size="sm" className="h-8 px-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
//             <ThumbsDown className="h-4 w-4" />
//           </Button>
//           <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
//             Reply
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }