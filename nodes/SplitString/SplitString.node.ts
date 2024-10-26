import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { MappingField } from './MappingField';

export class SplitString implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SplitString',
		name: 'splitString',
		icon: 'file:splitString.svg',
		group: ['input'],
		version: 1,
		description: 'Splits a string based on a separator in his parts',
		defaults: {
			name: 'Split String',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Value to Split',
				name: 'value',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g. hello/world',
				description: 'Value which should used to split a string'
			},
			{
				displayName: 'Separator',
				name: 'separator',
				type: 'string',
				default: '/',
				description: 'Separator which should be used to split a string',
			},
			{
				displayName: 'Mapping',
				name: 'mappings',
				placeholder: 'Add Mapping',
				type: 'fixedCollection',
				description: 'Define the mapping for each splitted value',
				typeOptions: {
					multipleValues: true,
					sortable: true,
				},
				default: {},
				options: [
					{
						name: 'values',
						displayName: 'Mapping',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
								placeholder: 'e.g. fieldName',
								description: 'Name of the field to set the value of',
							},
							{
								displayName: 'Index',
								name: 'index',
								type: 'string',
								default: '0',
								validateType: 'number',
								description: 'Index of the array to set the value of',
							},
						],
					},
				],
			},
			{
				displayName: 'Input Fields to Include',
				name: 'inputFields',
				type: 'string',
				default: '',
				description: 'Comma-separated List of Fields to include in Result',
				placeholder: 'e.g. field1,field2',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const value = this.getNodeParameter('value', 0) as string;
		const separator = this.getNodeParameter('separator', 0) as string;
		const inputFields = this.getNodeParameter('inputFields', 0) as string;
		const fields = this.getNodeParameter('mappings.values', 0) as MappingField[];

		let result: INodeExecutionData[] = [];

		const validInputFields: any[] = [];
		if (inputFields) {
			validInputFields.push(...inputFields.split(','));
		}

		if (value) {
			if (items) {
				items.forEach((item) => {
					const resultItem: any = {};

					const parts = value.split(separator);
					if (parts.length > 0) {
						for (const entry of fields) {
							const value = parts[entry.index];
							if (value) {
								resultItem[entry.name] = value;
							}
						}
					}

					validInputFields.forEach((field) => {
						const value = item.json[field];
						if (value) {
							resultItem[field] = value;
						}
					});

					result.push({ json: resultItem });
				});
			}
		} else {
			result = items;
		}

		return [result];
	}
}
