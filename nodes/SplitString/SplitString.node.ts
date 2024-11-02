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
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add option',
				default: {},
				options: [
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
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const separator = this.getNodeParameter('separator', 0) as string;
		const options = this.getNodeParameter('options', 0) as {
			mappings: {
				values: MappingField[];
			};
			inputFields: string;
		};

		const inputFields: any[] = [];
		if (options?.inputFields?.length > 0) {
			inputFields.push(...options.inputFields.split(',').map(x => x.trim()));
		}

		let mappings: MappingField[] = [];
		if (options?.mappings?.values?.length > 0) {
			mappings = options.mappings.values;
		}

		let result: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			// Prepare input fields for output
			const inputs: any = {};
			if (inputFields?.length > 0) {
				inputFields.forEach((field) => {
					const inputValue = item.json[field];
					if (inputValue) {
						inputs[field] = inputValue;
					}
				});
			}

			const valueToSplit = this.getNodeParameter('value', i) as string;
			const parts = valueToSplit?.split(separator);
			if (parts.length > 0) {
				if (mappings?.length > 0) {
					const resultItem: any = {};
					for (const mapping of mappings) {
						const value = parts[mapping.index];
						if (value) {
							resultItem[mapping.name] = value;
						}
					}
					result.push({
						json: {
							...resultItem,
							...inputs,
						},
					});
				} else {
					parts.forEach((part) => {
						result.push({
							json: {
								item: part,
								...inputs,
							},
						});
					});
				}
			}
		}

		return [result];
	}
}
