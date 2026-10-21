"use client";

import { useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { saveSeekerProfile } from "@/lib/actions/seeker";
import { SEEKER_TYPES } from "@/lib/constants";
import type { City } from "@/lib/types";
import { IMAGE_TYPES, publicUrl, uploadFile } from "@/lib/upload";
import { Avatar } from "../ui";

type Seeker = {
  org_name: string;
  type: string;
  description: string | null;
  city_id: number | null;
  website: string | null;
  instagram: string | null;
  pic_name: string | null;
  pic_title: string | null;
  logo_url: string | null;
};

export function SeekerProfileForm({ seeker, cities, userId }: { seeker: Seeker; cities: City[]; userId: string }) {
  const [logo, setLogo] = useState(seeker.logo_url);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const provinces = [...new Set(cities.map((c) => c.province))];

  async function onLogo(file: File | undefined) {
    if (!file) return;
    try {
      setLogo(publicUrl(await uploadFile("public-media", userId, file, IMAGE_TYPES)));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <form
      className="panel grid gap-4 p-5 sm:grid-cols-2 sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        start(async () => {
          const res = await saveSeekerProfile(fd);
          if (res.error) setError(res.error);
          else toast.success("Profil disimpan");
        });
      }}
    >
      <div className="flex items-center gap-4 sm:col-span-2">
        <Avatar src={logo} name={seeker.org_name} size={72} square />
        <label className="btn btn-outline btn-sm cursor-pointer">
          <Upload className="size-4" aria-hidden /> Unggah logo
          <input type="file" accept={IMAGE_TYPES.join(",")} className="sr-only" onChange={(e) => onLogo(e.target.files?.[0])} />
        </label>
        <input type="hidden" name="logo_url" value={logo ?? ""} />
      </div>
      <label className="block">
        <span className="label">Nama organisasi / kampanye</span>
        <input name="org_name" defaultValue={seeker.org_name} className="field" required />
      </label>
      <label className="block">
        <span className="label">Jenis</span>
        <select name="type" defaultValue={seeker.type} className="field">
          {SEEKER_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className="label">Tentang organisasi</span>
        <textarea name="description" defaultValue={seeker.description ?? ""} rows={4} maxLength={2000} className="field" placeholder="Apa yang kalian kerjakan, sejak kapan, untuk siapa." />
      </label>
      <label className="block">
        <span className="label">Kota</span>
        <select name="city_id" defaultValue={seeker.city_id ?? ""} className="field">
          <option value="">Pilih kota</option>
          {provinces.map((p) => (
            <optgroup key={p} label={p}>
              {cities
                .filter((c) => c.province === p)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">Situs web</span>
        <input name="website" defaultValue={seeker.website ?? ""} className="field" placeholder="contoh.org" />
      </label>
      <label className="block">
        <span className="label">Instagram</span>
        <input name="instagram" defaultValue={seeker.instagram ?? ""} className="field" placeholder="@akun" />
      </label>
      <span className="hidden sm:block" />
      <label className="block">
        <span className="label">Penanggung jawab (PIC)</span>
        <input name="pic_name" defaultValue={seeker.pic_name ?? ""} className="field" />
      </label>
      <label className="block">
        <span className="label">Jabatan PIC</span>
        <input name="pic_title" defaultValue={seeker.pic_title ?? ""} className="field" />
      </label>
      {error && (
        <p role="alert" className="rounded-lg bg-danger-wash px-3 py-2 text-sm text-danger sm:col-span-2">
          {error}
        </p>
      )}
      <div className="sm:col-span-2">
        <button className="btn btn-ink" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan profil"}
        </button>
      </div>
    </form>
  );
}
