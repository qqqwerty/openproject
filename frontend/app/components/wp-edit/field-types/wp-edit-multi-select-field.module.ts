// -- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2015 the OpenProject Foundation (OPF)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See doc/COPYRIGHT.rdoc for more details.
// ++

import {EditField} from '../wp-edit-field/wp-edit-field.module';
import {WorkPackageResourceInterface} from '../../api/api-v3/hal-resources/work-package-resource.service';
import {CollectionResource} from '../../api/api-v3/hal-resources/collection-resource.service';

export class MultiSelectEditField extends EditField {
  public options:any[];
  public template:string = '/components/wp-edit/field-types/wp-edit-multi-select-field.directive.html';
  public text:{requiredPlaceholder:string, placeholder:string, save:string, cancel:string};

  // Dependencies
  protected I18n:op.I18n = <op.I18n> MultiSelectEditField.$injector.get('I18n');

  public currentValueInvalid:boolean = false;

  constructor(workPackage:WorkPackageResourceInterface, fieldName:string, schema:op.FieldSchema) {
    super(workPackage, fieldName, schema);

    const I18n:any = this.$injector.get('I18n');
    this.text = {
      requiredPlaceholder: I18n.t('js.placeholders.selection'),
      placeholder: I18n.t('js.placeholders.default'),
      save: this.I18n.t('js.inplace.button_save', { attribute: this.schema.name }),
      cancel: this.I18n.t('js.inplace.button_cancel', { attribute: this.schema.name })
    };

    if (angular.isArray(this.schema.allowedValues)) {
      this.setValues(this.schema.allowedValues);
    } else if (this.schema.allowedValues) {
      this.schema.allowedValues.$load().then((values:CollectionResource) => {
        // The select options of the project shall be sorted
        if (values.count > 0 && (values.elements[0] as any)._type === 'Project') {
          this.setValues(values.elements, true);
        } else {
          this.setValues(values.elements);
        }
      });
    } else {
      this.setValues([]);
    }
  }

  private setValues(availableValues:any[], sortValuesByName:boolean = false) {
    if (sortValuesByName) {
      availableValues.sort(function(a:any, b:any) {
        var nameA = a.name.toLowerCase();
        var nameB = b.name.toLowerCase();
        return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
      });
    }

    this.options = availableValues;
    this.addEmptyOption();
    this.checkCurrentValueValidity();
  }

  private checkCurrentValueValidity() {
    this.currentValueInvalid = !!(
      (this.value && !_.some(this.options, (option) => (option.href === this.value.href)))
      ||
      (!this.value && this.schema.required)
    );
  }

  private addEmptyOption() {
    // Empty options are not available for required fields
    if (this.schema.required) {
      return;
    }

    // Since we use the original schema values, avoid adding
    // the option if one is returned / exists already.
    const emptyOption = _.find(this.options, { name: this.text.placeholder });
    if (emptyOption === undefined) {
      this.options.unshift({
        name: this.text.placeholder,
        href: null
      });
    }
  }
}
