"use client";

import { useEffect, useState } from "react";
import { Pet, Client } from "@/shared/models";
import { listPets } from "@/lib/services/pets";
import { listClients } from "@/lib/services/clients";
import { uniqueBreeds } from "@/lib/utils";

// Loads the org's pets and clients for typeaheads. Failures are swallowed —
// the dropdowns simply won't be offered.
export function useDirectory() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    Promise.all([listPets(), listClients()])
      .then(([p, c]) => {
        setPets(p);
        setClients(c);
      })
      .catch(() => {});
  }, []);

  return { pets, setPets, clients, setClients, breedSuggestions: uniqueBreeds(pets) };
}
