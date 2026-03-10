import sys

with open('src/routes/edit-info/+page.svelte', 'r', encoding='utf-8') as f:
    data = f.read()

script_end = data.find('</script>') + len('</script>')
script_part = data[:script_end]

alerts_start = data.find('{#if success && message}')
alerts_end = data.find('<h2 class="mt-10 text-xl font-semibold text-gray-900">Doctors</h2>')
alerts = data[alerts_start:alerts_end].strip()

doctors_start = data.find('<table', alerts_end)
doctors_end = data.find('</table>', doctors_start) + len('</table>')
doctors_table = data[doctors_start:doctors_end].replace('mt-4 w-lg', 'w-full min-w-[600px]')

tech_h2 = data.find('<h2 class="mt-10 text-xl font-semibold text-gray-900">Technicians</h2>')
tech_start = data.find('<table', tech_h2)
tech_end = data.find('</table>', tech_start) + len('</table>')
tech_table = data[tech_start:tech_end].replace('mt-4 w-lg', 'w-full min-w-[600px]')

clinics_h2 = data.find('<h2 class="mt-10 text-xl font-semibold text-gray-900">Clinics</h2>')
clinics_start = data.find('<table', clinics_h2)
clinics_end = data.find('</table>', clinics_start) + len('</table>')
clinics_table = data[clinics_start:clinics_end].replace('mt-4 w-lg', 'w-full min-w-[600px]')

case_types_h2 = data.find('<h2 class="mt-10 text-xl font-semibold text-gray-900">Case Types</h2>')
case_types_form_start = data.find('<!-- Add Case Type Form -->', case_types_h2)
case_types_form_end = data.find('</form>', case_types_form_start) + len('</form>')
case_types_form = data[case_types_form_start:case_types_form_end].replace('class="flex items-end gap-4 rounded-md bg-gray-50 p-4 shadow-sm"', 'class="flex flex-col sm:flex-row items-end gap-4 rounded-md bg-gray-50 p-4 shadow-sm w-full"')

case_types_table_start = data.find('<!-- Case Types Table -->', case_types_form_end)
case_types_table_end = data.find('</table>', case_types_table_start) + len('</table>')
case_types_table = data[case_types_table_start:case_types_table_end].replace('w-lg', 'w-full min-w-[600px]')

add_clinic_start = data.find('<!-- New section for adding only a clinic -->')
add_clinic_end = data.find('</form>', add_clinic_start) + len('</form>')
add_clinic_form = data[add_clinic_start:add_clinic_end].replace('mt-8 w-lg', 'w-full')

add_doctor_start = data.find('<!-- Update the existing combined form title -->')
add_doctor_end = data.find('</form>', add_doctor_start) + len('</form>')
add_doctor_form = data[add_doctor_start:add_doctor_end].replace('mt-8 w-lg', 'w-full')

add_tech_start = data.find('<!-- Add Technician Form -->')
add_tech_end = data.find('</form>', add_tech_start) + len('</form>')
add_tech_form = data[add_tech_start:add_tech_end].replace('mt-10 w-lg', 'w-full')

field_input_start = data.find('<!-- Conditionally render the new field input -->')
field_input_end = data.find('{/if}', field_input_start) + len('{/if}')
field_input = data[field_input_start:field_input_end]

new_html = f"""
<div class="mx-auto max-w-7xl px-4 py-8">
	{alerts}

	<div class="mt-6 flex flex-col xl:flex-row gap-12 items-start justify-center">
		<!-- LEFT COLUMN: Tables -->
		<div class="w-full xl:w-[60%] space-y-12">
			
			<section>
				<h2 class="text-xl font-semibold text-gray-900 border-b pb-2 mb-4">Doctors</h2>
				<div class="overflow-x-auto pb-4">
					{doctors_table}
				</div>
			</section>

			<section>
				<h2 class="text-xl font-semibold text-gray-900 border-b pb-2 mb-4">Clinics</h2>
				<div class="overflow-x-auto pb-4">
					{clinics_table}
				</div>
			</section>

			<section>
				<h2 class="text-xl font-semibold text-gray-900 border-b pb-2 mb-4">Technicians</h2>
				<div class="overflow-x-auto pb-4">
					{tech_table}
				</div>
			</section>

			<section>
				<h2 class="text-xl font-semibold text-gray-900 border-b pb-2 mb-4">Case Types</h2>
				<div class="overflow-x-auto pb-4">
					{case_types_table}
				</div>
			</section>
		</div>

		<!-- RIGHT COLUMN: Forms -->
		<div class="w-full xl:w-[40%] space-y-12 xl:sticky xl:top-8">
			<section class="space-y-4">
			    {add_clinic_form}
			</section>

			<section class="space-y-4">
			    {add_doctor_form}
			</section>

			<section class="space-y-4">
			    {add_tech_form}
			</section>

			<section class="space-y-4">
				<h2 class="text-xl font-semibold text-gray-900">Add Case Type</h2>
				{case_types_form}
			</section>

			{field_input}
		</div>
	</div>
</div>
"""

new_file_content = script_part + "\\n\\n" + new_html

with open('src/routes/edit-info/+page.svelte', 'w', encoding='utf-8') as f:
    f.write(new_file_content)

print("Layout rewritten successfully.")
