export const limitWords = (str:string, numWords:number) => {
  if (!str) return ''; // Handle cases where str is null or undefined

  // Use the robust function logic
  const words = str.trim().split(/\s+/);

  if (words.length <= numWords) {
    return str;
  }

  const truncatedString = words.slice(0, numWords).join(' ');
  return truncatedString;
};