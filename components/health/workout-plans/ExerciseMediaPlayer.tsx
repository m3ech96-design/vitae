"use client";
import { WorkoutPlanExercise } from "@/lib/types";
import { youtubeVideoId } from "@/lib/youtube";
import { useResolvedVideo } from "@/lib/use-resolved-video";
import { useResolvedImage } from "@/lib/use-resolved-image";

/** Il media di un esercizio, qualunque sia la sua fonte — un solo componente che decide da
 * sé cosa mostrare in base a `mediaType`, così ogni punto dell'app che deve mostrare
 * l'esercizio (la card nella tabella, il dettaglio) non deve ripetere questa scelta. */
export function ExerciseMediaPlayer({ exercise }: { exercise: WorkoutPlanExercise }) {
  const videoUrl = useResolvedVideo(exercise.mediaType === "video" ? exercise.mediaValue : undefined);
  const imageUrl = useResolvedImage(exercise.mediaType === "image" ? exercise.mediaValue : undefined);

  if (exercise.mediaType === "youtube" && exercise.mediaValue) {
    const videoId = youtubeVideoId(exercise.mediaValue);
    if (!videoId) return null;
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl2 bg-void-900">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={exercise.name}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (exercise.mediaType === "video" && videoUrl) {
    return (
      <video
        src={videoUrl}
        controls
        playsInline
        className="w-full rounded-xl2 bg-void-900"
      />
    );
  }

  if (exercise.mediaType === "image" && imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt={exercise.name} className="w-full rounded-xl2 object-cover" />;
  }

  return null;
}
