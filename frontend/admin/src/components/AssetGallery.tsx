import useAssets from '../hooks/useAssets'
import { Box, ImageList, ImageListItem, Typography } from '@mui/material'

export function AssetGallery({ category, folder }: { category: 'girl' | 'men'; folder?: string }) {
  const { items } = useAssets(category, folder)
  if (!items.length) return <Typography>No assets found</Typography>

  return (
    <Box>
      <ImageList cols={4} gap={8} sx={{ width: '100%' }}>
        {items.map(item => (
          <ImageListItem key={item.id}>
            <img src={item.url} alt={item.name} loading="lazy" />
          </ImageListItem>
        ))}
      </ImageList>
    </Box>
  )
}

export default AssetGallery
