/** @format */

/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { debounce, find, get, noop, size, trim } from 'lodash';
import { localize } from 'i18n-calypso';
import { v4 as uuid } from 'uuid';

/**
 * Internal dependencies
 */
import SuggestionSearch from 'components/suggestion-search';
import PopularTopics from 'components/site-verticals-suggestion-search/popular-topics';
import {
	requestDefaultVertical,
	getDefaultVerticalHttpData,
	getSiteVerticalHttpData,
	isVerticalSearchPending,
	requestSiteVerticalHttpData,
} from 'components/site-verticals-suggestion-search/utils';

/**
 * Style dependencies
 */
import './style.scss';

export class SiteVerticalsSuggestionSearch extends Component {
	static propTypes = {
		charsToTriggerSearch: PropTypes.number,
		initialValue: PropTypes.string,
		lastUpdated: PropTypes.number,
		onChange: PropTypes.func,
		placeholder: PropTypes.string,
		requestDefaultVertical: PropTypes.func,
		requestVerticals: PropTypes.func,
		shouldShowPopularTopics: PropTypes.func,
		searchResultsLimit: PropTypes.number,
		verticals: PropTypes.array,
		defaultVertical: PropTypes.object,
	};

	static defaultProps = {
		charsToTriggerSearch: 1,
		initialValue: '',
		onChange: noop,
		placeholder: '',
		requestDefaultVertical: noop,
		requestVerticals: noop,
		shouldShowPopularTopics: noop,
		searchResultsLimit: 5,
		verticals: [],
		defaultVertical: {},
	};

	constructor( props ) {
		super( props );
		this.state = {
			searchValue: props.initialValue,
			results: [],
			railcar: this.getNewRailcar(),
			isSuggestionSelected: false,
		};
		this.updateVerticalDataDebounced = debounce( this.updateVerticalData, 1000 );
		props.requestDefaultVertical();
	}

	componentDidMount() {
		// If we have a stored vertical, grab the preview
		this.props.initialValue && this.props.requestVerticals( this.props.initialValue, 1 );
	}

	componentDidUpdate( prevProps ) {
		// Check if there's a direct match for any subsequent HTTP requests
		if ( prevProps.lastUpdated !== this.props.lastUpdated ) {
			this.setSearchResults( this.props.verticals );
		}
	}

	/***
	 * Sets `state.results` with incoming HTTP results, retaining previous non-user vertical search results
	 * if the incoming HTTP results contain only user-defined results.
	 *
	 * This function could better be performed in the backend eventually.
	 *
	 * @param {Array} results Incoming HTTP results
	 */
	setSearchResults = results => {
		if ( size( results ) ) {
			// if the only result is a user input, then concat that with the previous results and remove the last user input
			if (
				! find( results, item => ! item.isUserInputVertical ) &&
				1 < size( this.state.results )
			) {
				results = this.state.results.filter( item => ! item.isUserInputVertical ).concat( results );
			}

			this.setState( { results }, () => {
				if ( false === this.state.isSuggestionSelected ) {
					this.updateVerticalData(
						this.searchForVerticalMatches( this.state.searchValue ),
						this.state.searchValue
					);
				} else {
					this.updateVerticalDataDebounced(
						this.searchForVerticalMatches( this.state.searchValue ),
						this.state.searchValue
					);
				}
			} );
		}
	};

	getNewRailcar() {
		return {
			id: `${ uuid().replace( /-/g, '' ) }-site-vertical-suggestion`,
			fetch_algo: '/verticals',
			action: 'site_vertical_selected',
		};
	}

	/***
	 * Searches the API results for a direct match on the user search query.
	 *
	 * @param {String} value Search query array
	 * @returns {Object?} An object from the vertical results array
	 */
	searchForVerticalMatches = ( value = '' ) => {
		value = trim( value.toLowerCase() );
		return find(
			this.state.results,
			item => item.verticalName.toLowerCase() === value && !! item.preview
		);
	};

	/***
	 * Callback to be passed to consuming component when the search value is updated.
	 *
	 * @param {Object} verticalData An object from the vertical results array
	 * @param {String} value Search query array
	 */
	updateVerticalData = ( verticalData, value = '' ) => {
		value = trim( value );
		this.props.onChange(
			verticalData || {
				isUserInputVertical: true,
				parent: '',
				preview: get( this.props.defaultVertical, 'preview', '' ),
				verticalId: '',
				verticalName: value,
				verticalSlug: value,
			}
		);
	};

	/***
	 * Callback to be passed to consuming component when the search field is updated.
	 *
	 * @param {String} value The new search value
	 */
	onSiteTopicChange = value => {
		if (
			!! value &&
			value !== this.state.searchValue &&
			size( value ) >= this.props.charsToTriggerSearch
		) {
			this.props.requestVerticals( value, this.props.searchResultsLimit );
			this.setState( { railcar: this.getNewRailcar() } );
		}
		this.setState( { searchValue: value, isSuggestionSelected: true } );
		this.updateVerticalDataDebounced( this.searchForVerticalMatches( value ), value );
	};

	/***
	 * Callback to be passed to consuming component a search suggestion is selected.
	 *
	 * @param {String} value The new search value
	 */
	onSiteTopicSelect = value => {
		this.props.requestVerticals( value, 1 );
		this.setState( { searchValue: value, isSuggestionSelected: false } );
	};

	getSuggestions = () => this.state.results.map( vertical => vertical.verticalName );

	render() {
		const { translate, placeholder, autoFocus } = this.props;
		const suggestions = this.getSuggestions();
		const showPopularTopics = ! this.state.searchValue && this.props.showPopular;

		return (
			<>
				<SuggestionSearch
					id="siteTopic"
					placeholder={ placeholder || translate( 'Enter a keyword or select one from below.' ) }
					onChange={ this.onSiteTopicChange }
					onSelect={ this.onSiteTopicSelect }
					suggestions={ suggestions }
					value={ this.state.searchValue }
					autoFocus={ autoFocus } // eslint-disable-line jsx-a11y/no-autofocus
					railcar={ this.state.railcar }
				/>
				{ showPopularTopics && <PopularTopics onSelect={ this.onSiteTopicSelect } /> }
			</>
		);
	}
}

export default localize(
	connect(
		() => {
			const siteVerticalHttpData = getSiteVerticalHttpData();
			const defaultVerticalHttpData = getDefaultVerticalHttpData();
			return {
				lastUpdated: get( siteVerticalHttpData, 'lastUpdated', 0 ),
				verticals: get( siteVerticalHttpData, 'data', [] ),
				defaultVertical: get( defaultVerticalHttpData, 'data[0]', {} ),
			};
		},
		( dispatch, ownProps ) => ( {
			isSearchPending: isVerticalSearchPending,
			shouldShowPopularTopics: searchValue => ! searchValue && ownProps.showPopular,
			requestVerticals: requestSiteVerticalHttpData,
			requestDefaultVertical,
		} )
	)( SiteVerticalsSuggestionSearch )
);
