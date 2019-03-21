/** @format */

/**
 * External dependencies
 */
import { get, trim } from 'lodash';

/**
 * Internal dependencies
 */
import { getHttpData, requestHttpData } from 'state/data-layer/http-data';
import { http } from 'state/data-layer/wpcom-http/actions';
import { convertToCamelCase } from 'state/data-layer/utils';

export const SITE_VERTICALS_REQUEST_ID = 'site-verticals-search-results';
export const DEFAULT_SITE_VERTICAL_REQUEST_ID = 'default-site-verticals-search-results';

export function getSiteVerticalHttpData() {
	return getHttpData( SITE_VERTICALS_REQUEST_ID );
}

export function getDefaultVerticalHttpData() {
	return getHttpData( DEFAULT_SITE_VERTICAL_REQUEST_ID );
}

export function requestSiteVerticalHttpData(
	searchTerm,
	limit = 7,
	id = SITE_VERTICALS_REQUEST_ID
) {
	searchTerm = trim( searchTerm );
	requestHttpData(
		id,
		http( {
			apiNamespace: 'wpcom/v2',
			method: 'GET',
			path: '/verticals',
			query: {
				search: searchTerm,
				limit,
				include_preview: true,
			},
		} ),
		{
			fromApi: () => data => [ [ id, convertToCamelCase( data ) ] ],
			freshness: -Infinity,
		}
	);
}

export function requestDefaultVertical( searchTerm = 'business' ) {
	if ( ! get( getDefaultVerticalHttpData(), 'data', null ) ) {
		requestSiteVerticalHttpData( searchTerm, 1, DEFAULT_SITE_VERTICAL_REQUEST_ID );
	}
}

export function isVerticalSearchPending() {
	return 'pending' === get( getHttpData( SITE_VERTICALS_REQUEST_ID ), 'state', false );
}
