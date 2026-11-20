import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './site-files.mjs';

const escape = value => String(value ?? '').replace(/[&<>"']/gu, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

function profileLink(url, label) {
  if (!url) return '';
  return `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

function projectDetails(project) {
  if (!project) return '';

  const methodDetails = (project.contributions ?? [])
    .filter(contribution => !/experiment|deployment/iu.test(contribution.label))
    .map(contribution => `<li><strong>${escape(contribution.label)}.</strong> ${escape(contribution.description)}</li>`)
    .join('');

  return `<details class="project-details">
            <summary>Project details</summary>
            <p class="project-meta">${escape(project.title)} · ${escape(project.organization)} · ${escape(project.dateLabel)}</p>
            <p class="project-role">${escape(project.role)} · ${escape(project.type)}</p>
            <p>${escape(project.overview)}</p>
            ${methodDetails ? `<ul class="project-methods">${methodDetails}</ul>` : ''}
          </details>`;
}

export function profileSections() {
  const profile = JSON.parse(readFileSync(join(root, 'content/profile.json'), 'utf8').replace(/^\uFEFF/u, ''));
  const { person } = profile;
  const currentDegree = profile.education.find(item => item.status === 'ongoing');
  const currentRole = profile.internships.find(item => item.end === null);
  const affiliations = [];
  if (currentDegree) {
    affiliations.push(`${currentDegree.degree} student in ${currentDegree.field} at ${currentDegree.institution}`);
  }
  if (currentRole) {
    const workplace = [currentRole.organization, currentRole.lab].filter(Boolean).join(' ');
    affiliations.push(`${currentRole.role} at ${workplace}`);
  }

  const nameParts = person.name.trim().split(/\s+/u);
  const lastWord = nameParts.pop();
  const displayName = [...nameParts.map(escape), `<span class="name-ink">${escape(lastWord)}</span>`].join(' ');
  const hero = `<h1 id="hero-title">${displayName}</h1>
        ${affiliations.map(line => `<p class="hero-identity">${escape(line)}</p>`).join('\n        ')}
        <nav class="profile-links" aria-label="Profile links">
          <a href="mailto:${escape(person.email)}">Email</a>
          ${profileLink(person.github, 'GitHub')}
          ${profileLink(person.scholar, 'Google Scholar')}
        </nav>`;

  const interests = `<p class="hero-bio">${escape(person.bio)}</p>
        <ul class="research-interests">${person.researchInterests.map(interest => `<li>${escape(interest)}</li>`).join('')}</ul>
        <p class="profile-tools">Tools <span>${profile.skills.programming.map(escape).join(' · ')}</span></p>`;

  const research = profile.publications.map(publication => {
    const project = profile.research.find(item => item.id === publication.researchId);
    const state = publication.status === 'submitted'
      ? `${publication.statusLabel} · Under review`
      : publication.statusLabel;
    const [title, ...subtitle] = publication.title.split(':');
    const resources = [
      profileLink(publication.arxiv, 'Paper'),
      profileLink(publication.code, 'Code'),
      profileLink(publication.projectPage, 'Project page'),
    ].filter(Boolean);
    const links = resources.length
      ? `<nav class="publication-links" aria-label="${escape(publication.title)} resources">${resources.join(' ')}</nav>`
      : '';
    const actions = [links, projectDetails(project)].filter(Boolean).join('\n          ');

    return `<article class="publication" id="${escape(publication.id)}">
          <h3><strong>${escape(title)}${subtitle.length ? ':' : ''}</strong> ${escape(subtitle.join(':').trim())}</h3>
          <p class="publication-meta">${escape(publication.authorsDisplay)} · <span class="publication-status">${escape(state)}</span></p>
          ${actions}
        </article>`;
  }).join('\n');

  const internships = profile.internships.map(item => `<article class="experience-entry">
              <h3>${escape(item.organization)}${item.lab ? ` · ${escape(item.lab)}` : ''}</h3>
              <p class="experience-meta">${escape(item.role)} · ${escape(item.topic)} · ${escape(item.dateLabel)}</p>
              <p>${escape(item.description)}</p>
            </article>`).join('\n');

  const education = profile.education.map(item => `<article class="education-entry">
              <h3>${escape(item.institution)}</h3>
              <p class="education-meta">${escape(item.degree)} in ${escape(item.field)} · ${escape(item.dateLabel)}</p>
              <p>${escape(item.school)}</p>
            </article>`).join('\n');

  const journey = `<section class="experience-group" aria-labelledby="experience-title">
            <h2 id="experience-title">Experience</h2>
            ${internships}
          </section>
          <section class="education-group" aria-labelledby="education-title">
            <h2 id="education-title">Education</h2>
            ${education}
          </section>`;

  const interestsText = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' })
    .format(profile.interests.map(interest => interest.toLowerCase()));
  const about = `<p>I enjoy ${escape(interestsText)}.</p>
          ${profile.otherExperience.map(item => `<p>${escape(item)}</p>`).join('\n')}`;

  const contact = `<a href="mailto:${escape(person.email)}" class="contact-email">${escape(person.email)}</a>`;

  return { hero, interests, research, journey, about, contact };
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
