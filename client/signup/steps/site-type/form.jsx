/**
 * External dependencies
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import CountedTextarea from 'components/forms/counted-textarea';
import { getAllSiteTypes } from 'lib/signup/site-type';
import { recordTracksEvent } from 'state/analytics/actions';

/**
 * Style dependencies
 */
import './style.scss';

class SiteTypeForm extends Component {
	static propTypes = {
		submitForm: PropTypes.func.isRequired,

		// from localize() HoC
		translate: PropTypes.func.isRequired,
	};

	state = {
		otherValue: '',
		siteType: '',
		hasOtherReasonFocus: false,
	};

	onOtherCatChange = event => {
		this.setState( {
			otherValue: event.target.value,
		} );
	};

	handleSubmit = type => {
		this.props.recordTracksEvent( 'calypso_signup_actions_submit_site_type', {
			value: type,
		} );

		this.setState( { siteType: type } );

		this.props.submitForm( type );
	};

	handleSubmitOther = () => {
		if ( ! this.state.otherValue || this.state.hasOtherReasonFocus ) {
			return;
		}
		this.handleSubmit( 'other' );
	};

	setOtherReasonFocus = focus => () => {
		this.setState( { hasOtherReasonFocus: focus } );
	};

	render() {
		const { translate } = this.props;
		return (
			<Card className="site-type__wrapper">
				{ getAllSiteTypes().map( siteTypeProperties => (
					<Card
						className="site-type__option"
						key={ siteTypeProperties.id }
						displayAsLink
						data-e2e-title={ siteTypeProperties.slug }
						onClick={ this.handleSubmit.bind( this, siteTypeProperties.slug ) }
					>
						<strong className="site-type__option-label">{ siteTypeProperties.label }</strong>
					</Card>
				) ) }
				<Card
					className="site-type__option"
					key={ 7 }
					displayAsLink
					data-e2e-title="other"
					onClick={ this.handleSubmitOther }
				>
					<strong className="site-type__option-label">{ 'Other' }</strong>
					<CountedTextarea
						className="site-type__option-other"
						maxLength={ 30 }
						acceptableLength={ 20 }
						placeholder={ translate( 'Tell us about your website' ) }
						onChange={ this.onOtherCatChange }
						value={ this.state.otherValue }
						showRemainingCharacters
						onBlur={ this.setOtherReasonFocus( false ) }
						onFocus={ this.setOtherReasonFocus( true ) }
					/>
				</Card>
			</Card>
		);
	}
}

export default connect(
	null,
	{
		recordTracksEvent,
	}
)( localize( SiteTypeForm ) );
