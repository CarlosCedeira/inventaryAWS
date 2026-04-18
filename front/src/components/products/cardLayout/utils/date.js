export const formatDate = (dateString) => {
    console.log("Formatting date:", dateString);
  if (!dateString) return "";
  return new Date(dateString).toISOString().split("T")[0];
};