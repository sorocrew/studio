import React, { useMemo, useState } from 'react';
import { ArrowUpRight, ExternalLink, Plus, Search, Sparkles } from 'lucide-react';

type Project = {
  name: string;
  description: string;
  category: string;
  url: string;
  sourceUrl: string;
  network: string;
};

const starterProjects: Project[] = [
  {
    name: 'Stellar Vault Demo',
    description: 'Explore a Soroban vault example with a React dApp and a multisig governed allowlist.',
    category: 'DeFi',
    url: 'https://stellar-vault-demo-dapp-app-alpha.vercel.app',
    sourceUrl: 'https://github.com/BootNodeDev/stellar-vault-demo-dapp',
    network: 'Testnet',
  },
  {
    name: 'Stellar AppKit Demos',
    description: 'Try wallet connection, transaction signing, payments, and Soroban interaction examples.',
    category: 'Developer tools',
    url: 'https://demos.stellar-appkit.saganta.com/',
    sourceUrl: 'https://demos.stellar-appkit.saganta.com/',
    network: 'Testnet',
  },
  {
    name: 'Stellar Demo Wallet',
    description: 'A hands-on wallet integration demo for testing Stellar application protocols.',
    category: 'Wallets',
    url: 'https://demo-wallet.stellar.org/',
    sourceUrl: 'https://demo-wallet.stellar.org/',
    network: 'Testnet',
  },
];

const categories = ['All projects', 'DeFi', 'Wallets', 'Developer tools', 'Payments', 'Games', 'Other'];
const storageKey = 'sorocrew-gallery-projects-v1';

function readCommunityProjects(): Project[] {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) as Project[] : [];
  } catch {
    return [];
  }
}

interface ExploreGalleryProps {
  onTryProject: (url: string) => void;
}

export const ExploreGallery: React.FC<ExploreGalleryProps> = ({ onTryProject }) => {
  const [communityProjects, setCommunityProjects] = useState<Project[]>(readCommunityProjects);
  const [category, setCategory] = useState('All projects');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState('');
  const projects = useMemo(() => [...communityProjects, ...starterProjects], [communityProjects]);
  const filteredProjects = projects.filter((project) => {
    const matchesCategory = category === 'All projects' || project.category === category;
    const text = `${project.name} ${project.description} ${project.category}`.toLowerCase();
    return matchesCategory && text.includes(query.toLowerCase());
  });

  const addProject = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const projectUrl = String(formData.get('url')).trim();
    const sourceUrl = String(formData.get('sourceUrl')).trim();
    const validHttpUrl = (value: string) => {
      try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
    };
    if (!validHttpUrl(projectUrl) || !validHttpUrl(sourceUrl)) {
      setNotice('Enter a valid http or https URL for both links.');
      return;
    }
    const project: Project = {
      name: String(formData.get('name')).trim(),
      description: String(formData.get('description')).trim(),
      category: String(formData.get('category')),
      url: projectUrl,
      sourceUrl,
      network: String(formData.get('network')),
    };
    const next = [project, ...communityProjects];
    setCommunityProjects(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setNotice('Project added on this device.');
    } catch {
      setNotice('Project added for this session. Browser storage is unavailable.');
    }
    setShowForm(false);
    event.currentTarget.reset();
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border-2 border-black bg-yellow-300 px-3 py-1 text-xs font-black uppercase tracking-wide shadow-[2px_2px_0_#000]">
            <Sparkles className="h-4 w-4" /> Stellar ecosystem
          </div>
          <h1 className="font-['Black_Ops_One'] text-4xl md:text-5xl">Explore Soroban apps</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
            Find projects built on Stellar, open their live demos, and try them alongside your Studio network and account tools.
          </p>
        </div>
        <button onClick={() => { setShowForm((value) => !value); setNotice(''); }} className="neo-btn-blue shrink-0">
          <Plus className="h-4 w-4" /> Submit a project
        </button>
      </div>

      {notice && <div role="status" className="mb-4 rounded border-2 border-black bg-blue-100 px-3 py-2 text-sm font-bold">{notice}</div>}

      {showForm && (
        <form onSubmit={addProject} className="neo-box mb-7 grid gap-3 p-4 md:grid-cols-2">
          <div className="md:col-span-2"><h2 className="text-lg font-black">Add an ecosystem project</h2><p className="text-xs text-slate-600">Submissions are currently saved in this browser. Share the live demo and source repository.</p></div>
          <input name="name" required maxLength={60} placeholder="Project name" className="neo-input" />
          <select name="category" className="neo-input">{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select>
          <input name="url" required type="url" placeholder="Live app URL (https://...)" className="neo-input" />
          <input name="sourceUrl" required type="url" placeholder="Source or project URL (https://...)" className="neo-input" />
          <input name="network" required maxLength={30} placeholder="Network (e.g. Testnet)" className="neo-input" />
          <input name="description" required maxLength={180} placeholder="What can people try?" className="neo-input" />
          <div className="flex gap-2 md:col-span-2"><button className="neo-btn-blue" type="submit">Add project</button><button className="neo-btn" type="button" onClick={() => setShowForm(false)}>Cancel</button></div>
        </form>
      )}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" className="neo-input w-full pl-9" /></label>
        <div className="flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-lg border-2 border-black px-3 py-2 text-xs font-black ${category === item ? 'bg-black text-white' : 'bg-white hover:bg-slate-100'}`}>{item}</button>)}</div>
      </div>

      <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500"><span>{filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}</span><span>Live demos · Stellar ecosystem</span></div>
      {filteredProjects.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map((project, index) => (
          <article key={`${project.url}-${index}`} className="flex min-h-64 flex-col rounded-xl border-2 border-black bg-white p-5 shadow-[4px_4px_0_#000]">
            <div className="mb-4 flex items-start justify-between gap-3"><span className="rounded border-2 border-black bg-blue-100 px-2 py-1 text-[10px] font-black uppercase">{project.category}</span><span className="text-[10px] font-bold uppercase text-slate-500">{project.network}</span></div>
            <h2 className="text-xl font-black">{project.name}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{project.description}</p>
            <div className="mt-5 flex flex-wrap gap-2"><button onClick={() => onTryProject(project.url)} className="neo-btn-blue py-2 text-xs">Try in Studio <ArrowUpRight className="h-3.5 w-3.5" /></button><a href={project.sourceUrl} target="_blank" rel="noopener noreferrer" className="neo-btn py-2 text-xs">Project details <ExternalLink className="h-3.5 w-3.5" /></a></div>
          </article>
        ))}
      </div> : <div className="neo-box px-6 py-12 text-center"><h2 className="text-xl font-black">No matching projects yet</h2><p className="mt-2 text-sm text-slate-600">Try another search or submit a project to start the directory.</p></div>}
      <p className="mt-7 text-center text-xs text-slate-500">Project listings are community provided. Check each project’s details and network before connecting a wallet.</p>
    </main>
  );
};
