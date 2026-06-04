export const fmt = (n: number) => "₦" + n.toLocaleString();

export const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export const formatTime = (dateString: string) =>
  new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
