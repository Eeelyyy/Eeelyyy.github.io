import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './site-files.mjs';

const escape = value => String(value ?? '').replace(/[&<>"']/gu, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const external = (url, label, className = '') => url ? `<a class="${className}" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${label} <span aria-hidden="true">↗</span></a>` : '';

export function profileSections() {
  const profile = JSON.parse(readFileSync(join(root, 'content/profile.json'), 'utf8').replace(/^\uFEFF/u, ''));
  const { person } = profile;
  const names = person.name.split(' ');
  const hero = `<h1 id="hero-title">${escape(names.slice(0, -1).join(' '))}<br>${escape(names.at(-1))}<span class="name-period">.</span></h1>
        <p class="hero-tagline">A little curiosity.<br><em>A world of possibilities.</em></p>
        <p class="hero-bio">${escape(person.bio)}</p>
        <div class="hero-links"><a class="primary-link" href="#research">Explore my research <span aria-hidden="true">↘</span></a>${external(person.scholar, 'Google Scholar', 'text-link')}</div>`;
  const research = profile.publications.map((publication, index) => {
    const project = profile.research.find(item => item.id === publication.researchId);
    const [name, ...title] = publication.title.split(':');
    const state = publication.status === 'submitted' ? `${publication.statusLabel} · Under review` : publication.statusLabel;
    const links = external(publication.arxiv, 'Paper') + external(publication.code, 'Code') + external(publication.projectPage, 'Project');
    const contributions = (project?.contributions ?? []).filter(item => !/Experiments/iu.test(item.label)).map(item => `<div><h4>${escape(item.label)}</h4><p>${escape(item.description)}</p></div>`).join('');
    return `<article class="research-item reveal" id="${escape(publication.id)}">
          <div class="research-index mono">0${index + 1}<span>${escape(publication.venue)}</span></div>
          <div class="research-body"><span class="publication-status ${publication.status === 'accepted' ? 'accepted' : 'submitted'}">${escape(state)}</span><h3>${escape(name)}<span>${escape(title.join(':').trim())}</span></h3><p class="authors">${escape(publication.authorsDisplay)}</p><p class="research-summary">${escape(project?.overview ?? '')}</p>
          ${project ? `<details class="research-detail"><summary>Inside the research <span aria-hidden="true">+</span></summary><div class="detail-body"><p class="project-meta mono">${escape(project.type)} / ${escape(project.role)}<br>${escape(project.organization)} · ${escape(project.dateLabel)}</p>${contributions}</div></details>` : ''}</div>
          ${links ? `<div class="paper-links">${links}</div>` : '<div class="paper-links pending-note mono">MANUSCRIPT<br>UNDER REVIEW</div>'}
        </article>`;
  }).join('\n');
  const journey = `<h3 class="timeline-label mono">RESEARCH EXPERIENCE</h3>${profile.internships.map(item => `<article class="timeline-row reveal"><p class="timeline-date mono">${escape(item.dateLabel)}</p><h4>${escape(item.organization)} <span>/ ${escape(item.lab)}</span></h4><p class="timeline-role">${escape(item.role)} · ${escape(item.topic)}</p><p class="timeline-description">${escape(item.description)}</p></article>`).join('')}
          <h3 class="timeline-label education-label mono">EDUCATION</h3>${profile.education.map(item => `<article class="timeline-row reveal ${item.status === 'incoming' ? 'incoming' : ''}"><p class="timeline-date mono">${escape(item.dateLabel)}${item.status === 'incoming' ? ' <span class="incoming-label">UP NEXT</span>' : ''}</p><h4>${escape(item.institution)}</h4><p class="timeline-role">${escape(item.degree)} in ${escape(item.field)}</p><p class="timeline-description">${escape(item.school)}</p></article>`).join('')}`;
  return {
    hero,
    interests: `<p>${person.researchInterests.map(item => `<span>${escape(item)}</span>`).join('')}</p>`,
    research,
    journey,
    about: `<p>Outside research, I enjoy ${escape(new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(profile.interests.map(item => item.toLowerCase())))}.</p><p>${escape(profile.otherExperience.join(' '))}</p><div class="interest-tags">${profile.interests.map(item => `<span>${escape(item)}</span>`).join('')}</div><p class="tool-note mono">WORKING WITH ${profile.skills.programming.map(escape).join(' / ')}</p>`,
    contact: `<div class="contact-links"><a class="email-link" href="mailto:${escape(person.email)}">${escape(person.email)} <span aria-hidden="true">↗</span></a><div class="social-links">${external(person.github, 'GitHub')}${external(person.scholar, 'Google Scholar')}</div><p class="mono">COMPUTER VISION / GENERATIVE MODELS</p></div>`,
  };
}

export function renderProfile(html) {
  for (const [name, content] of Object.entries(profileSections())) {
    const start = `<!-- profile:${name}:start -->`;
    const end = `<!-- profile:${name}:end -->`;
    const from = html.indexOf(start);
    const to = html.indexOf(end, from);
    if (from < 0 || to < 0) throw new Error(`Missing profile block: ${name}`);
    html = `${html.slice(0, from + start.length)}\n${content}\n${html.slice(to)}`;
  }
  return html;
}
