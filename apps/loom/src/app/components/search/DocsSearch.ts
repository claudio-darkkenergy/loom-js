import { component, el, route } from '@loom-js/core';
import { PinkModal } from '@loom-js/pink';
import classNames from 'classnames';

import styles from './search.module.css';
import { docsSearchState } from '@/app/logic/activity/docs-search';
import {
    isSearchIndexFailure,
    searchIndex
} from '@/app/logic/activity/search-index';
import { docsSearchToggle } from '@/app/logic/activity/toggles';
import { type RankedResult, rank } from '@/app/logic/search/rank';

const RESULTS_ID = 'docs-search-results';
const resultId = (index: number) => `docs-search-result-${index}`;

const resultHref = ({ entry: { anchor, slug } }: RankedResult) =>
    anchor ? `/docs/${slug}#${anchor}` : `/docs/${slug}`;

// Close first, then route: the dialog's native close restores focus to the
// trigger before the new topic renders.
const goTo = (result: RankedResult) => {
    docsSearchToggle.update(false);
    route(null, { href: resultHref(result) });
};

const wrapIndex = (index: number, length: number) =>
    length ? (index + length) % length : 0;

// The results of the latest render, for the input's keyboard handler.
let currentResults: RankedResult[] = [];

// The input's keyboard contract: arrows move the selection, Enter follows
// it, Escape closes. Enter and Escape are intercepted so the `method=dialog`
// form never submits and a `type=search` input never swallows Escape.
const onInputKeydown = (event: Event) => {
    const { key } = event as KeyboardEvent;
    const { selection } = docsSearchState.value();

    switch (key) {
        case 'ArrowDown':
        case 'ArrowUp':
            event.preventDefault();
            docsSearchState.update({
                selection: wrapIndex(
                    selection + (key === 'ArrowDown' ? 1 : -1),
                    currentResults.length
                )
            });
            break;
        case 'Enter': {
            event.preventDefault();

            const result = currentResults[selection];

            result && goTo(result);
            break;
        }
        case 'Escape':
            event.preventDefault();
            docsSearchToggle.update(false);
            break;
    }
};

const ResultItem = (result: RankedResult, index: number, isActive: boolean) =>
    el('li')({
        attrs: { 'aria-selected': isActive, role: 'option' },
        className: classNames('clickable-list-item', {
            [styles.active]: isActive
        }),
        id: resultId(index),
        children: el('button')({
            attrs: { type: 'button' },
            className: 'clickable-list-button u-width-full-line u-text-start',
            onClick: () => goTo(result),
            children: [
                el('span')({
                    className: 'clickable-list-title',
                    children: [
                        result.entry.title,
                        result.entry.heading
                            ? [
                                  el('span')({
                                      attrs: { 'aria-hidden': true },
                                      className: 'clickable-list-title-sep',
                                      children: '›'
                                  }),
                                  result.entry.heading
                              ]
                            : undefined
                    ]
                }),
                el('span')({
                    className: classNames(
                        'clickable-list-desc',
                        styles.snippet
                    ),
                    children: result.snippet
                })
            ]
        })
    });

const StatusLine = (message: string, attrs: Record<string, string> = {}) =>
    el('p')({ attrs, children: message, className: styles.status });

const ResultsList = (results: RankedResult[], selection: number) =>
    el('ul')({
        attrs: { role: 'listbox' },
        className: classNames('clickable-list', styles.results),
        id: RESULTS_ID,
        children: results.map((result, index) =>
            ResultItem(result, index, index === selection)
        )
    });

// Rendered per state change — the input lives outside this region, so
// typing never re-renders (and never blurs) it.
const SearchResults = component((html) => {
    return html`
        <div class=${styles.resultsRegion}>
            ${searchIndex.effect(({ value: index }) => {
                if (isSearchIndexFailure(index)) {
                    return StatusLine('Search is unavailable right now.', {
                        role: 'alert'
                    });
                }

                if (!index) {
                    return;
                }

                return docsSearchState.effect(
                    ({ value: { query, selection } }) => {
                        currentResults = rank(query, index);

                        if (!query.trim()) {
                            return;
                        }

                        if (!currentResults.length) {
                            return StatusLine(`No results for “${query}”.`);
                        }

                        return ResultsList(currentResults, selection);
                    }
                );
            })}
        </div>
    `;
});

/**
 * The docs search palette: a search input over the build-emitted index,
 * ranked results, keyboard selection, and client-side navigation to the
 * chosen heading. Mounted lazily by the layout on first open.
 */
export const DocsSearch = component<{ isOpen: boolean }>((html, { isOpen }) => {
    searchIndex.update(null);

    return html`
            <${PinkModal}
                className=${styles.palette}
                isOpen=${isOpen}
                onClose=${() => docsSearchToggle.update(false)}
                size="big"
                title="Search docs"
            >
                <div class="u-flex u-cross-center u-gap-8">
                    <div class="input-text-wrapper u-flex-basis-100-percent">
                        <input
                            $input=${(event: Event) =>
                                docsSearchState.update({
                                    query: (event.target as HTMLInputElement)
                                        .value
                                })}
                            $keydown=${onInputKeydown}
                            aria-activedescendant=${docsSearchState.bind(
                                ({ query, selection }) =>
                                    query ? resultId(selection) : ''
                            )}
                            aria-autocomplete="list"
                            aria-controls=${RESULTS_ID}
                            autocomplete="off"
                            autofocus
                            class="input-text"
                            placeholder="Search the docs"
                            role="combobox"
                            type="search"
                        />
                        <span class="icon-search" aria-hidden="true"></span>
                    </div>
                    <kbd class="kbd is-not-mobile">Esc</kbd>
                </div>
                ${SearchResults()}
            </>
        `;
});
