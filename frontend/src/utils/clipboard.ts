export async function copyToClipboard(text: string) {
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch (fallbackError) {
      console.error('Failed to copy text to clipboard', fallbackError);
    }
  }
}
