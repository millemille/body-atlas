/** Persistent CC-BY-SA credit for shipped BodyParts3D / Z-Anatomy meshes. */
export function MeshCredit() {
  return (
    <p
      data-atlas-chrome
      className="max-w-xl px-4 text-center text-[10px] leading-snug text-muted-ink/70"
    >
      <span className="md:hidden">
        BodyParts3D / Z-Anatomy meshes · <span className="text-muted-ink/85">CC BY-SA</span> · not a
        clinical map.
      </span>
      <span className="hidden md:inline">
        Skeleton and muscle meshes: BodyParts3D (DBCLS) via Z-Anatomy —{' '}
        <span className="text-muted-ink/85">CC BY-SA</span>
        {' · '}
        attribute + share-alike. Ivory styling is ours. Not a clinical map.
      </span>
    </p>
  )
}
