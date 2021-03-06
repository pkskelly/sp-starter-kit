import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneSlider
} from '@microsoft/sp-webpart-base';

import * as strings from 'PersonalCalendarWebPartStrings';
import { SpStarterKitSharedLibrary } from '@starter-kit/shared-library';
import PersonalCalendar from './components/PersonalCalendar';
import { IPersonalCalendarProps } from './components/IPersonalCalendarProps';
import { MSGraphClient } from '@microsoft/sp-http';
import { Providers, SharePointProvider } from '@microsoft/mgt';
import { ThemeProvider, ThemeChangedEventArgs, IReadonlyTheme, ISemanticColors } from '@microsoft/sp-component-base';

export interface IPersonalCalendarWebPartProps {
  title: string;
  refreshInterval: number;
  daysInAdvance: number;
  numMeetings: number;
}

export default class PersonalCalendarWebPart extends BaseClientSideWebPart<IPersonalCalendarWebPartProps> {
  private propertyFieldNumber;
  // theme provider
  private _themeProvider: ThemeProvider;
  // current theme
  private _themeVariant: IReadonlyTheme | undefined;
  
  public onInit(): Promise<void> {
    // Consume the new ThemeProvider service
    this._themeProvider = this.context.serviceScope.consume(ThemeProvider.serviceKey);

    // If it exists, get the theme variant
    this._themeVariant = this._themeProvider.tryGetTheme();

    // Register a handler to be notified if the theme variant changes
    this._themeProvider.themeChangedEvent.add(this, this._handleThemeChangedEvent);
    
    Providers.globalProvider = new SharePointProvider(this.context);
   
    return Promise.resolve();
  }

  public render(): void {
    
    const element: React.ReactElement<IPersonalCalendarProps> = React.createElement(
      PersonalCalendar,
      {
        title: this.properties.title,
        refreshInterval: this.properties.refreshInterval,
        daysInAdvance: this.properties.daysInAdvance,
        numMeetings: this.properties.numMeetings,
        // pass the current display mode to determine if the title should be
        // editable or not
        displayMode: this.displayMode,
        themeVariant: this._themeVariant,
        // handle updated web part title
        updateProperty: (value: string): void => {
          // store the new title in the title web part property
          this.properties.title = value;
        }
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  //executes only before property pane is loaded.
  protected async loadPropertyPaneResources(): Promise<void> {
    // import additional controls/components

    const { PropertyFieldNumber } = await import(
      /* webpackChunkName: 'pnp-propcontrols-number' */
      '@pnp/spfx-property-controls/lib/propertyFields/number'
    );

    this.propertyFieldNumber = PropertyFieldNumber;
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupFields: [
                this.propertyFieldNumber("refreshInterval", {
                  key: "refreshInterval",
                  // label: strings.RefreshInterval,
                  label: SpStarterKitSharedLibrary.getLocale('RefreshInterval'),
                  value: this.properties.refreshInterval,
                  minValue: 1,
                  maxValue: 60
                }),
                PropertyPaneSlider('daysInAdvance', {
                  label: strings.DaysInAdvance,
                  min: 0,
                  max: 7,
                  step: 1,
                  value: this.properties.daysInAdvance
                }),
                PropertyPaneSlider('numMeetings', {
                  label: strings.NumMeetings,
                  min: 0,
                  max: 20,
                  step: 1,
                  value: this.properties.numMeetings
                })
              ]
            }
          ]
        }
      ]
    };
  }
  protected _handleThemeChangedEvent = (args: ThemeChangedEventArgs): void => {
    this._themeVariant = args.theme;
    this.render();
  }
}
