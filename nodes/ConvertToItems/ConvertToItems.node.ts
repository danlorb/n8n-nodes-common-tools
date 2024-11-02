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
		description: 'Converts a Table to a JSON Items',
		defaults: {
			name: 'Convert To Items',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Table',
				description: 'Table as String. It could be a Markdown Table or a CSV File.',
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
				description:
					'Value to search for in the defined search column. If empty every value will be returned.',
			},
			{
				displayName: 'Search by Column',
				name: 'searchBy',
				type: 'string',
				default: '',
				description:
					'Define the column name which should be used for searching. If empty every value will be returned.',
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

		const options = this.getNodeParameter('options', 0) as {
			includeRowsWithEmptyFields: boolean;
			convertToDictionary: boolean;
		};

		let result: INodeExecutionData[] = [];

		if (items.length > 0) {
			for (let i = 0; i < items.length; i++) {
				const item = items[i];

				const tableInput = this.getNodeParameter('table', i) as string;
				const table = ConvertToItems.convertTable(tableInput);

				const searchBy = this.getNodeParameter('searchBy', i) as string;
				const search = this.getNodeParameter('search', i) as string;
				const include = this.getNodeParameter('include', i) as string;

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

				// Add only Fields which are defined by validFields, otherwise return all
				let validFields: string[] = [];
				if (include) {
					validFields = include.split(',').map((x) => x.trim());

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
				}

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
						});
					});
					itemResult = arrayResult;
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
		if (table.trim().startsWith('|')) {
			return this.convertMarkdownTable(table);
		} else {
			return this.convertPlainTable(table);
		}
	}
	private static convertPlainTable(table: string): any[] {
		const result: any[] = [];

		const lines = ConvertToItems.trimArray(table.split('\n'));
		const columns = lines[0]
			.split(',')
			.filter((x) => x.trim() !== '')
			.map((x) => x.trim());

		lines
			.slice(1)
			.map((row) => row.split(',').map((x) => x.trim()))
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

	private static convertMarkdownTable(table: string): any[] {
		const lines = ConvertToItems.trimArray(table.split('\n'));
		const filteredLines = lines.filter(
			(x) =>
				!(
					x.startsWith('| -') ||
					x.startsWith('|-') ||
					x.startsWith('| :-') ||
					x.startsWith('|:-')
				) && x.trim() !== '',
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

	private static trimArray(lines: string[]): string[] {
		if (lines?.length > 0) {
			// Remove empty lines at beginning
			if (lines[0] === '') {
				lines = lines.slice(1);
			}

			// Remove empty lines at end
			if (lines[lines.length - 1] === '') {
				lines = lines.slice(0, lines.length - 1);
			}
		}

		return lines;
	}
}
