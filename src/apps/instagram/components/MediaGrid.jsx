import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

const MediaGrid = ({
  media = [],
  maxMedia = 5,
  onMediaAdd,
  onMediaRemove,
  onMediaPreview,
  onMediaGenerate,
  selectedTypeLabel = 'Media',
  mediaLabel = 'Ajouter un média',
  accept = 'image/*,video/*',
  aiKind = 'image'
}) => {
  const [visibleSlots, setVisibleSlots] = useState(3);

  const canAddMoreMedia = media.length < maxMedia;
  const effectiveSlotCount = Math.min(Math.max(3, visibleSlots, media.length), maxMedia);
  const canAddEmptySlot = effectiveSlotCount < maxMedia;

  // Créer le tableau de slots à afficher (médias + cases vides)
  const displayedSlots = Array.from({ length: effectiveSlotCount }).map((_, index) => {
    if (index < media.length) {
      return { kind: 'media', mediaItem: media[index], key: `media-${media[index].id}` };
    }
    return { kind: 'add', key: `add-slot-${index}` };
  });

  return (
    <div className="ig-media-grid-wrapper">
      <div className={`ig-media-grid media-grid-slots-${effectiveSlotCount}`}>
        {displayedSlots.map((slot) => {
          const mediaItem = slot.kind === 'media' ? slot.mediaItem : null;
          const isAddSlot = slot.kind === 'add';

          return (
            <div
              key={slot.key}
              className={`ig-media-grid-item ${isAddSlot ? 'ig-media-grid-add-slot' : ''}`}
            >
              {mediaItem ? (
                <>
                  <div
                    className="ig-media-preview-wrapper ig-media-preview-clickable"
                    onClick={() => onMediaPreview?.(mediaItem)}
                  >
                    {mediaItem.kind === 'video' ? (
                      <video
                        src={mediaItem.url}
                        className="ig-media-preview"
                        muted
                        loop
                      />
                    ) : (
                      <img
                        src={mediaItem.url}
                        alt="Média sélectionné"
                        className="ig-media-preview"
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    className="ig-media-remove-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      onMediaRemove?.(mediaItem.id);
                    }}
                    aria-label="Supprimer ce média"
                    title="Supprimer"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="ig-media-slot-content ig-media-slot-simple"
                  onClick={() => onMediaAdd?.()}
                  title={`Importer ${mediaLabel.toLowerCase()}`}
                  aria-label={`Importer ${mediaLabel.toLowerCase()}`}
                >
                  <Plus size={18} />
                  <small className="ig-media-slot-label">Media</small>
                </button>
              )}
            </div>
          );
        })}

        {canAddEmptySlot ? (
          <button
            type="button"
            className="ig-media-grid-item ig-media-grid-add-more"
            onClick={() => setVisibleSlots((prev) => Math.min(prev + 1, maxMedia))}
            title="Ajouter une case média"
            aria-label="Ajouter une case média"
          >
            <Plus size={24} />
            <small>Ajouter</small>
          </button>
        ) : null}
      </div>

      {media.length === 0 && effectiveSlotCount === 0 ? (
        <div className="ig-media-empty-state">
          Sélectionnez ou générez un média pour commencer
        </div>
      ) : null}
    </div>
  );
};

export default MediaGrid;
