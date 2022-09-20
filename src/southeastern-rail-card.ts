/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  LovelaceCardEditor,
  getLovelace,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import type { SoutheasternRailCardConfig } from './types';
import { actionHandler } from './action-handler-directive';
// import { CARD_VERSION } from './const';
import { localize } from './localize/localize';

/* eslint no-console: 0 */
// console.info(
//   `%c  SOUTHEASTERN-RAIL-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
//   'color: orange; font-weight: bold; background: black',
//   'color: white; font-weight: bold; background: dimgray',
// );

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'southeastern-rail-card',
  name: 'Southeastern Rail Card',
  description: 'A custom template to present departure details from a configured station enabled from the Southeastern Rail Integration',
});

@customElement('southeastern-rail-card')
export class SoutheasternRailCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./editor');
    return document.createElement('southeastern-rail-card-editor');
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: SoutheasternRailCardConfig;

  public setConfig(config: SoutheasternRailCardConfig): void {
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = {
      ...config,
    };
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  protected getEntity(entityName): any | void {
    if (this.hass && entityName in this.hass.states) {
      return this.hass.states[entityName];
    }
  }

  isCancelled(entity) {
    const status = entity.service.etd;
    return !(status !== "Cancelled" && entity.calling_points !== undefined);
  }

  isDelayed(service): boolean {
    // If the train is on time, etd would display "On Time"
    const re = /[0-9]/i;
    const status = service.etd || "";
    return status.match(re);
  }

  formatTime(time): string {
    return time.replace("_", ":");
  }

  getTimeDiff(from, to): number {
    const fromDate = new Date('2000.1.1 ' + from);
    let toDate = new Date('2000.1.1 ' + to);

    if (toDate < fromDate) {
        toDate = new Date('2000.1.2 ' + to);
    }

    const diff = toDate.getTime() - fromDate.getTime();
    return (diff / 1000) / 60;
  }

  destinationVia(service): string | void {
    if (service?.destination && service.destination?.location && service.destination.location?.via) {
      return service.destination.location.via;
    }
  }

  departureTime(entity): string | void {
    if (this.isCancelled(entity)) {
      return;
    }

    const service = entity.service;
    let time = service.std;
    if (this.isDelayed(service)) {
      time = service.etd;
    }

    return this.formatTime(time);
  }

  arrivalTime(entity): string | void {
    if (this.isCancelled(entity)) {
      return;
    }

    const callingPoints = entity?.calling_points || [];
    const indexes = callingPoints.length;
    if (indexes) {
      const lastStop = callingPoints[indexes - 1];
      return this.formatTime(lastStop.st);
    }
  }

  stationMessage(entity): TemplateResult | void {
    // return html`<ha-alert alert-type="success">blah blah blah</ha-alert>`;
    if (this.config.show_warning && entity.message) {
      const message = entity.message.replace('this station', entity.station_name + ' station');
      return html`<div class="messages">${this._showWarning(message)}</div>`;
    }
  }

  protected _renderServiceStatus(entity): TemplateResult | void {
    if (!this.config.show_status) {
      return;
    }

    let alertType = "success";
    if (this.isCancelled(entity)) {
      alertType = "error";
    } else if (this.isDelayed(entity)) {
      alertType = "warning";
    }

    return html`<div class="status ${alertType}">
      <ha-alert alert-type="${alertType}">
        <ha-icon id="bus-clock" icon="mdi:bus-clock"></ha-icon>
        ${this.isDelayed(entity.service) ?
          html`Delayed (<span class="delayed">${this.formatTime(entity.service.std)}</span>)`
          :
          entity.service.etd
        }
      </ha-alert>
    </div>`;
  }

  protected _renderServiceTimes(entity): TemplateResult | void {
    if (this.isCancelled(entity)) {
      return;
    }

    let arrival, departure;
    if (this.config.show_departure_time) {
      departure = html`
      <div class="train-times__col">
        <h2 class="train-times__title">Departs</h2>
        <div class="train-times__time">${this.departureTime(entity)}</div>
      </div>`;
    }
    if (this.config.show_arrival_time) {
      arrival = html`
      <div class="train-times__col">
        <ha-icon class="arrow" icon="mdi:arrow-right-bold"></ha-icon>
        <h2 class="train-times__title">Arrives</h2>
        <div class="train-times__time">${this.arrivalTime(entity)}</div>
      </div>`;
    }
    if (arrival || departure) {
      return html`<div class="train-times">
        ${departure}
        ${arrival}
      </div>`;
    }
  }

  protected _renderCallingPoints(entity): TemplateResult | void {
    if (this.isCancelled(entity) || !this.config.show_callingpoints) {
      return;
    }

    return html`<div class="calling-points">
      <h3 class="calling-points__title">Calling At</h3>
      <div class="calling-points_container">
        <marquee>
          <div class="calling-point_items">
            ${entity.calling_points.map((stop, index) => {
              return html`<div class="calling-point">
                ${index > 0 ? html`<ha-icon class="arrow" icon="mdi:arrow-right"></ha-icon>`:null}
                <div class="calling-points__stop">${stop.locationName}</div>
                <div class="calling-points__time">(${stop.st})</div>
              </div>`
            })}
          </div>
        </marquee>
      </div>
    </div>`;
  }

  protected _renderLastUpdated(): TemplateResult | void {
    const entity = this.getEntity(this.config.entity);
    if (entity && entity.last_updated) {
      const date = new Date(entity.last_updated);
      return html`<div class="last_updated">Last Updated: <span class="date">${date.toLocaleString()}</span></div>`;
    }
  }

  protected render(): TemplateResult | void {
    // if (this.config.show_error) {
    //   return this._showError(localize('common.show_error'));
    // }

    const entity = this.getEntity(this.config.entity);
    // console.log(entity);

    return html`
      <ha-card
        .header=${this.config.name ? this.config.name : entity ? entity.attributes.friendly_name : "Southeastern Rail"}
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this.config.hold_action),
          hasDoubleClick: hasAction(this.config.double_tap_action),
        })}
        tabindex="0"
        .label=${`Southeastern Rail: ${this.config.entity || 'No Entity Defined'}`}
      >
        <div class="card-content">
          ${this.config.show_via_destination ? html`<div class="via-destination">${this.destinationVia(entity.attributes.service)}</div>` : null}
          ${this.stationMessage(entity.attributes)}
          ${this._renderServiceStatus(entity.attributes)}
          ${this._renderServiceTimes(entity.attributes)}
          ${this._renderCallingPoints(entity.attributes)}
          <div class="content-footer">${this._renderLastUpdated()}</div>
        </div>
      </ha-card>
    `;
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, this.config, ev.detail.action);
    }
  }

  private _showWarning(warning: string): TemplateResult {
    return html` <hui-warning>${warning}</hui-warning> `;
  }

  // private _showError(error: string): TemplateResult {
  //   const errorCard = document.createElement('hui-error-card');
  //   errorCard.setConfig({
  //     type: 'error',
  //     error,
  //     origConfig: this.config,
  //   });

  //   return html` ${errorCard} `;
  // }

  static get styles(): CSSResultGroup {
    return css`
      .via-destination {
        margin-top: -20px;
        padding-bottom: 8px;
      }

      .messages {
        margin-bottom: 8px;
      }

      .status {
        font-weight: bold;
        text-transform: uppercase;
      }
      .status.success {
        color: #006E00;
      }
      .status.error {
        color: #FF0000;
      }
      .status.warning {
        color: #FFB300;
      }

      .status .delayed {
        text-decoration:line-through;
        color: #000000;
        font-weight: normal;
      }

      .train-times {
        display: flex;
        gap: 8px;
        align-items: center;
        text-align: center;
        margin-top: 8px;
      }

      .train-times .train-times__col {
        background:#F5F5F5;
        border-radius: 5px;
        padding: 8px;
        width: 50%;
        position: relative;
      }

      .train-times .train-times__col .arrow {
        position: absolute;
        left: -25px;
        top:10%;
        color: #CCCCCC;
        --mdc-icon-size: 55px;
      }

      .train-times .train-times__col h2 {
        margin: 0;
        margin-bottom: 8px;
      }

      .train-times__time {
        font-size: 2rem;
      }

      .calling-points__title {
        margin-bottom: 6px;
        font-weight: normal;
      }

      .calling-points_container {
        background: #FCFCFC;
        border-radius: 5px;
        padding: 8px;
        padding-bottom: 0;
        margin-bottom: 8px;
      }

      .calling-point_items {
        display: flex;
        gap: 16px;
      }

      .calling-point_items .calling-point {
        display: flex;
        gap: 8px;
      }

      .calling-point_items .calling-point .calling-points__stop {
        font-weight: bold;
      }

      .calling-point_items .calling-point .arrow {
        margin-left: -8px;
      }

      .last_updated {
        text-align: right;
        font-size: 0.8em;
      }

      .last_updated .date {
        font-style: italic;
      }
    `;
  }
}
