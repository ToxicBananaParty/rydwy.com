import * as Dialog from '@radix-ui/react-dialog';

type Props = {
  thumbSrc: string;
  thumbWidth: number;
  thumbHeight: number;
  fullSrc: string;
  alt: string;
};

export default function Lightbox({
  thumbSrc,
  thumbWidth,
  thumbHeight,
  fullSrc,
  alt,
}: Props) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button" className="lightbox-trigger">
          <img
            src={thumbSrc}
            width={thumbWidth}
            height={thumbHeight}
            alt={alt}
            loading="lazy"
            decoding="async"
          />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="lightbox-overlay" />
        <Dialog.Content className="lightbox-content" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">{alt}</Dialog.Title>
          <img src={fullSrc} alt={alt} />
          <Dialog.Close asChild>
            <button type="button" className="lightbox-close" aria-label="Close">
              ×
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
