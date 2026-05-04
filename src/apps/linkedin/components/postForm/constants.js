import { BookOpenText, Image as ImageIcon, Type, Video } from 'lucide-react'

export const TYPE_CONFIG = {
  text: {
    label: 'Text',
    icon: Type,
    placeholder: "Partagez une idee, une actualite ou une opinion professionnelle...",
    hasMedia: false,
    // FIX: all types now have URL and hashtags
    hasLink: true,
    hasHashtags: true,
    mediaLabel: '',
  },
  image: {
    label: 'Image',
    icon: ImageIcon,
    placeholder: 'Ajoutez du contexte a votre image pour engager votre audience...',
    hasMedia: true,
    // FIX: all types now have URL and hashtags
    hasLink: true,
    hasHashtags: true,
    mediaLabel: 'Ajouter une image',
  },
  video: {
    label: 'Video',
    icon: Video,
    placeholder: 'Decrivez votre video, ses points cles et l appel a l action...',
    hasMedia: true,
    // FIX: all types now have URL and hashtags
    hasLink: true,
    hasHashtags: true,
    mediaLabel: 'Ajouter une video',
    isVideo: true,
  },
  article: {
    label: 'Article',
    icon: BookOpenText,
    placeholder: "Introduisez votre article et donnez envie d'aller le lire...",
    hasMedia: true,
    hasLink: true,
    hasHashtags: true,
    mediaLabel: "Ajouter l'image de couverture",
  },
}

export const FONT_OPTIONS = [
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Trebuchet MS", sans-serif', label: 'Trebuchet' },
  { value: '"Courier New", monospace', label: 'Courier' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
]

export const DEFAULT_STYLE = {
  fontFamily: 'Inter, sans-serif',
  cardWidth: 100,
  mediaHeight: 380,
}