/*!
 * @license fixture { with braces }
 */
import {isDevMode} from '@angular/core';
// @ts-ignore
import ERRORS_NAV_DATA from '../../../content/reference/errors/routes.json' with {type: 'json'};

export const DOCS_SUB_NAVIGATION_DATA: NavigationItem[] = [
  {
    label: 'Introduction',
    children: [{label: 'What is Angular?', path: 'overview', contentPath: 'introduction/what-is-angular'}],
  },
  {
    label: 'In-depth Guides',
    children: [
      {
        label: 'Signals',
        status: 'updated',
        children: [
          {label: 'Overview', path: 'guide/signals', contentPath: 'guide/signals/overview'},
          // a comment with a } brace
          {label: "It's linked", path: 'guide/signals/linked-signal', contentPath: 'guide/signals/linked-signal'},
        ],
      },
      {label: 'Security', path: 'best-practices/security', contentPath: 'guide/security', isCrossReferenced: true},
    ],
  },
  {
    label: 'Developer Tools',
    children: [{label: 'CLI', children: [{label: 'Overview', path: 'tools/cli', contentPath: 'tools/cli/overview'}]}],
  },
  {
    label: 'Best Practices',
    children: [
      {label: 'Security', path: 'best-practices/security', contentPath: 'guide/security'},
      {label: 'Style guide', path: 'style-guide', contentPath: 'best-practices/style-guide', status: 'new' as const},
    ],
  },
  {
    label: 'Extended Ecosystem',
    children: [{label: 'Angular Material', path: 'https://material.angular.dev/'}],
  },
  ...(isDevMode()
    ? [{label: 'Adev Dev Guide', children: [{label: 'Kitchen Sink', path: 'kitchen-sink', contentPath: 'kitchen-sink'}]}]
    : []),
];

export const TUTORIALS_SUB_NAVIGATION_DATA: NavigationItem[] = [...ERRORS_NAV_DATA];
