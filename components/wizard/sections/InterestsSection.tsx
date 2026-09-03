"use client";
import { PersonalDetails } from "@/lib/types";
import { INTEREST_CATEGORIES } from "@/lib/interest-categories";
import { ThumbGridField } from "../ThumbGridField";
import { TagListField } from "../TagListField";
import { TagMultiSelect } from "../TagMultiSelect";
import { DynamicFieldList } from "../DynamicFieldList";

export function InterestsSection({
  data,
  onUpdate,
}: {
  data: PersonalDetails;
  onUpdate: (patch: Partial<PersonalDetails>) => void;
}) {
  return (
    <div className="space-y-7">
      <ThumbGridField
        label="Film preferiti"
        items={data.favoriteMovies}
        onChange={(favoriteMovies) => onUpdate({ favoriteMovies })}
        placeholder="Es. Blade Runner 2049"
      />
      <ThumbGridField
        label="Musica preferita"
        items={data.favoriteMusic}
        onChange={(favoriteMusic) => onUpdate({ favoriteMusic })}
        placeholder="Es. Radiohead"
      />
      <ThumbGridField
        label="Libri preferiti"
        items={data.favoriteBooks}
        onChange={(favoriteBooks) => onUpdate({ favoriteBooks })}
        placeholder="Es. Norwegian Wood"
      />
      <ThumbGridField
        label="Videogiochi preferiti"
        items={data.favoriteGames}
        onChange={(favoriteGames) => onUpdate({ favoriteGames })}
        placeholder="Es. Hades"
      />
      <TagListField
        label="Cibi preferiti"
        tags={data.favoriteFoods}
        onChange={(favoriteFoods) => onUpdate({ favoriteFoods })}
        placeholder="Aggiungi..."
      />
      <TagListField
        label="Luoghi d'interesse"
        tags={data.placesOfInterest}
        onChange={(placesOfInterest) => onUpdate({ placesOfInterest })}
        placeholder="Aggiungi..."
      />
      <TagMultiSelect
        label="Categoria preferita"
        options={INTEREST_CATEGORIES}
        selected={data.favoriteCategories}
        onChange={(favoriteCategories) => onUpdate({ favoriteCategories })}
      />
      <DynamicFieldList
        fields={data.interestsCustomFields}
        onChange={(interestsCustomFields) => onUpdate({ interestsCustomFields })}
        allowThumbnail
      />
    </div>
  );
}
