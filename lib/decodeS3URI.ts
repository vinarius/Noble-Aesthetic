export function decodeS3URI(uri: string): string {
  const withSpaces = uri.replace(/\+/g, ' ');
  return decodeURIComponent(withSpaces);
}