export function useItemImage() {
  function itemImageSrc(image?: string): string {
    if (!image) return ''
    // data URLs and absolute paths used as-is
    if (image.startsWith('data:') || image.startsWith('/') || image.startsWith('http')) {
      return image
    }
    return `/images/${image}`
  }

  return { itemImageSrc }
}
