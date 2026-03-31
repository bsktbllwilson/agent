"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { Partner, Guide, WaitlistEntry } from "@/lib/types";
import {
  isAdminLoggedIn,
  adminLogin,
  adminLogout,
  getPartners,
  addPartner,
  deletePartner,
  getGuides,
  addGuide,
  deleteGuide,
  getWaitlist,
} from "@/lib/store";
import { LogOut, Plus, Trash2 } from "lucide-react";

type Tab = "partners" | "guides" | "waitlist";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("partners");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [guides, setGuidesState] = useState<Guide[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);

  useEffect(() => {
    setMounted(true);
    setAuthed(isAdminLoggedIn());
  }, []);

  const loadData = useCallback(() => {
    if (tab === "partners") setPartners(getPartners());
    else if (tab === "guides") setGuidesState(getGuides());
    else setWaitlist(getWaitlist());
  }, [tab]);

  useEffect(() => {
    if (authed) loadData();
  }, [authed, loadData]);

  function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;
    if (adminLogin(password)) {
      setAuthed(true);
    } else {
      alert("Invalid password");
    }
  }

  function handleLogout() {
    adminLogout();
    setAuthed(false);
  }

  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-center">Admin Login</h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Default password: <code className="rounded bg-sand-100 px-1.5 py-0.5">bridgeeast2024</code>
        </p>
        <Card className="mt-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium">Password</label>
              <Input id="password" name="password" type="password" required className="mt-1" />
            </div>
            <Button type="submit" className="w-full">Sign In</Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="mr-1 h-4 w-4" /> Sign Out
        </Button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-sand-200">
        {(["partners", "guides", "waitlist"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "border-terracotta text-terracotta"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "partners" && (
          <PartnersTab partners={partners} onChange={() => setPartners(getPartners())} />
        )}
        {tab === "guides" && (
          <GuidesTab guides={guides} onChange={() => setGuidesState(getGuides())} />
        )}
        {tab === "waitlist" && <WaitlistTab entries={waitlist} />}
      </div>
    </div>
  );
}

function PartnersTab({
  partners,
  onChange,
}: {
  partners: Partner[];
  onChange: () => void;
}) {
  const [showForm, setShowForm] = useState(false);

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    addPartner({
      name: form.get("name") as string,
      firm: form.get("firm") as string,
      category: form.get("category") as string,
      specialty: form.get("specialty") as string,
      languages: (form.get("languages") as string).split(",").map((l) => l.trim()),
      email: form.get("email") as string,
      website: (form.get("website") as string) || "",
      verified: true,
    });
    onChange();
    setShowForm(false);
  }

  function handleDelete(id: string) {
    deletePartner(id);
    onChange();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">{partners.length} partners</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" /> Add Partner
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2">
            <Input name="name" placeholder="Name" required />
            <Input name="firm" placeholder="Firm" required />
            <Select name="category" required>
              <option value="">Category</option>
              <option value="Real Estate Brokers">Real Estate Brokers</option>
              <option value="Immigration Attorneys">Immigration Attorneys</option>
              <option value="Ingredient Distributors">Ingredient Distributors</option>
              <option value="PR & Localization">PR & Localization</option>
              <option value="Accountants & Tax">Accountants & Tax</option>
            </Select>
            <Input name="languages" placeholder="Languages (comma-separated)" required />
            <Input name="email" type="email" placeholder="Email" required />
            <Input name="website" placeholder="Website URL" />
            <Textarea name="specialty" placeholder="Specialty description" className="sm:col-span-2" required />
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit">Save Partner</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {partners.map((p) => (
          <Card key={p.id} className="flex items-center justify-between py-4">
            <div>
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-gray-500">{p.firm} &middot; {p.category}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function GuidesTab({
  guides,
  onChange,
}: {
  guides: Guide[];
  onChange: () => void;
}) {
  const [showForm, setShowForm] = useState(false);

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const title = form.get("title") as string;
    addGuide({
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      category: form.get("category") as string,
      phase: parseInt(form.get("phase") as string, 10),
      content: form.get("content") as string,
      published: true,
    });
    onChange();
    setShowForm(false);
  }

  function handleDelete(id: string) {
    deleteGuide(id);
    onChange();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">{guides.length} guides</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" /> Add Guide
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2">
            <Input name="title" placeholder="Guide Title" required />
            <Select name="category" required>
              <option value="">Category</option>
              <option value="Visa & Legal">Visa & Legal</option>
              <option value="Permits & Licensing">Permits & Licensing</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Operations">Operations</option>
              <option value="Marketing">Marketing</option>
            </Select>
            <Select name="phase" required>
              <option value="">Phase</option>
              <option value="1">Phase 1</option>
              <option value="2">Phase 2</option>
              <option value="3">Phase 3</option>
              <option value="4">Phase 4</option>
            </Select>
            <div />
            <Textarea name="content" placeholder="Guide content (Markdown)" rows={10} className="sm:col-span-2" required />
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit">Save Guide</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {guides.map((g) => (
          <Card key={g.id} className="flex items-center justify-between py-4">
            <div>
              <p className="font-semibold">{g.title}</p>
              <p className="text-sm text-gray-500">{g.category} &middot; Phase {g.phase}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(g.id)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function WaitlistTab({ entries }: { entries: WaitlistEntry[] }) {
  return (
    <div>
      <p className="mb-6 text-sm text-gray-500">{entries.length} signups</p>
      {entries.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No waitlist signups yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-sand-200">
          <table className="w-full text-sm">
            <thead className="bg-sand-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Brand</th>
                <th className="px-4 py-3 text-left font-semibold">Country</th>
                <th className="px-4 py-3 text-left font-semibold">Target Date</th>
                <th className="px-4 py-3 text-left font-semibold">Signed Up</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={entry.id} className={i % 2 === 0 ? "" : "bg-sand-50/50"}>
                  <td className="px-4 py-3">{entry.email}</td>
                  <td className="px-4 py-3">{entry.brand_name}</td>
                  <td className="px-4 py-3">{entry.origin_country}</td>
                  <td className="px-4 py-3">{entry.target_open_date}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
