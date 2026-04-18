type UserLike = {
  name?: string | null;
  username?: string | null;
  displayUsername?: string | null;
};

export function authorName(user: UserLike, fallback = "Anonymous"): string {
  return (
    user.displayUsername ?? user.username ?? user.name ?? fallback
  );
}
