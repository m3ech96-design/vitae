import { UserProfile, Person } from "./types";
import { FamilyEntity } from "./family-relations";

export function toFamilyEntities(profile: UserProfile, people: Person[]): FamilyEntity[] {
  const userEntity: FamilyEntity = {
    id: "user",
    firstName: profile.firstName || "Tu",
    lastName: profile.lastName,
    avatarUrl: profile.avatarUrl,
    gender: profile.gender,
    birthday: profile.birthday,
    fatherId: profile.fatherId,
    motherId: profile.motherId,
    spouseId: profile.spouseId,
    exSpouseIds: profile.exSpouseIds,
    partnerPersonId: profile.partnerPersonId,
  };
  return [
    userEntity,
    ...people.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      avatarUrl: p.avatarUrl,
      gender: p.gender,
      deceased: p.deceased,
      deceasedYear: p.deceasedYear,
      birthday: p.birthday,
      kind: p.kind,
      fatherId: p.fatherId,
      motherId: p.motherId,
      spouseId: p.spouseId,
      exSpouseIds: p.exSpouseIds,
      partnerPersonId: p.partnerPersonId,
    })),
  ];
}
