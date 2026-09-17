/**
 * Galleria foto di un luogo — spostata in components/ui/PhotoGallery.tsx perché lo stesso
 * bisogno (mostrare una o più foto per intero, mai ritagliate, con tocco per ingrandire)
 * ricorre anche fuori dalla Mappa. Questo file resta come alias per non toccare l'import
 * esistente in PlaceWindow.tsx.
 */
export { PhotoGallery as PlaceGallery } from "../ui/PhotoGallery";
