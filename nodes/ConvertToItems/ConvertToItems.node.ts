import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

export class ConvertToItems implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Convert to Items',
		name: 'configToItems',
		icon: 'file:convertToItems.svg',
		group: ['transform'],
		version: 1,
		description: 'Converts a Markdown Table to a JSON Items',
		defaults: {
			name: 'Convert To Items',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Markdown Table',
				description: 'Markdown Table as String',
				name: 'table',
				type: 'string',
				required: true,
				default: '',
				typeOptions: {
					rows: 8,
				},
			},
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				description: 'Value to search for in the defined search column'
			},
			{
				displayName: 'Search by Column',
				name: 'searchBy',
				type: 'string',
				default: '',
				description: 'Define the column name which should be used for searching',
			},
			{
				displayName: 'Fields to Include',
				name: 'include',
				type: 'string',
				default: '',
				description: 'Comma-separated List of Fields to include in Result',
				placeholder: 'e.g. field1,field2',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add option',
				default: {},
				options: [
					{
						displayName: 'Include Rows with Empty Fields',
						name: 'includeRowsWithEmptyFields',
						type: 'boolean',
						default: false,
						description: 'Whether to include rows with empty fields in the result',
					},
					{
						displayName: 'Convert Result to Dictionary',
						name: 'convertToDictionary',
						type: 'boolean',
						default: false,
						description: 'Whether to convert rows as dictionary or not',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const tableInput = this.getNodeParameter('table', 0) as string;
		const searchBy = this.getNodeParameter('searchBy', 0) as string;
		const include = this.getNodeParameter('include', 0) as string;
		const options = this.getNodeParameter('options', 0) as {
			includeRowsWithEmptyFields: boolean;
			convertToDictionary: boolean;
		};

		let validFields: string[] = [];
		if (include) {
			validFields = include.split(',');
		}

		if (validFields && validFields.length > 0) {
			const table = ConvertToItems.convertTable(tableInput);

			let result: INodeExecutionData[] = [];

			for(let i = 0; i < items.length; i++) {
				const item = items[i];

				const search = this.getNodeParameter('search',i) as string;

				let itemResult: INodeExecutionData[] = [];
				table.forEach((rows) => {
					if (search && searchBy) {
						const value = rows[searchBy];
						if (value && value === search) {
							itemResult.push({
								json: {
									...item.json,
									...rows,
								},
							});
						}
					} else {
						itemResult.push({
							json: {
								...item.json,
								...rows,
							},
						});
					}
				});

				// Add only Fields which are defined by validFields
				const formattedResult: INodeExecutionData[] = [];
				itemResult.forEach((x) => {
					const tempItem: any = {};
					validFields.forEach((field) => {
						tempItem[field] = x.json[field];
					});
					formattedResult.push({
						json: tempItem,
					});
				});
				itemResult = formattedResult;

				// Convert to Dictionary
				if (options.convertToDictionary) {
					const arrayResult: INodeExecutionData[] = [];
					itemResult.forEach((x) => {
						const keys = Object.keys(x.json);
						keys.forEach((key) => {
							arrayResult.push({
								json: {
									key,
									value: x.json[key],
								},
							});
						})
					});
					itemResult = arrayResult
				}

				// Remove rows with empty fields
				if (!options?.includeRowsWithEmptyFields) {
					const cleanedResult: INodeExecutionData[] = [];
					itemResult.forEach((row) => {
						let isValid = true;
						const keys = Object.keys(row.json);
						keys.forEach((column) => {
							const value = row.json[column];
							if (!value) {
								isValid = false;
							}
						});

						if (isValid) {
							cleanedResult.push(row);
						}
					});
					itemResult = cleanedResult;
				}

				// Deploy the results
				itemResult.forEach((x) => result.push(x));
			}

			return [result];
		}

		return [items];
	}

	private static convertTable(table: string): any[] {
		const lines = table.split('\n');
		const filteredLines = lines.filter(
			(x) => !(x.startsWith('| -') || x.startsWith('|-')) && x.trim() !== '',
		);

		const result: any[] = [];

		const columns = filteredLines[0]
			.split('|')
			.filter((x) => x.trim() !== '')
			.map((x) => x.trim());

		filteredLines
			.slice(1)
			.map((row) => {
				const rowResult = row.split('|').map((x) => x.trim());

				return rowResult.slice(1, rowResult.length - 1);
			})
			.forEach((x) => {
				const row: any = {};
				for (let i = 0; i < x.length; i++) {
					const column = columns[i];
					row[column] = x[i];
				}

				if (row) {
					result.push(row);
				}
			});

		return result;
	}
}
