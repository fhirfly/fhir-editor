import React, { useState, useEffect } from 'react';
import structureDefinitionData from './r4b/profiles-resources.json';  // Import the data directly


function parseStructureDefinitions(data) {
    if (!data || !data.entry) {
        return [];
    }

    const structureDefinitions = data.entry
        .filter((entry) => entry.resource && entry.resource.resourceType === 'StructureDefinition')
        .map((entry) => entry.resource);

    const fields = [];

    structureDefinitions.forEach((structureDefinition) => {
        if (structureDefinition.snapshot && structureDefinition.snapshot.element) {
            structureDefinition.snapshot.element.forEach((element) => {
                const fieldName = element.path.split('.').pop();
                const isRequired = element.min > 0;
                const dataTypeCode = element.type && element.type.length > 0 ? element.type[0].code : undefined;

                fields.push({
                    name: fieldName,
                    label: fieldName,
                    dataType: dataTypeCode,
                    required: isRequired,
                });
            });
        }
    });

    return fields;
}

function FHIREditor() {
    const [formData, setFormData] = useState({});  // Store form data
    const [fields, setFields] = useState([]);  // Store fields based on StructureDefinition

    useEffect(() => {
        // Parse StructureDefinition to determine fields and their data types
        const parsedFields = parseStructureDefinitions(structureDefinitionData);
        setFields(parsedFields);
    }, []);

    function renderFormInputs() {
        return fields.map((field, index) => {
            let inputElement;
    
            switch (field.dataType) {
                case "string":
                    inputElement = (
                        <input 
                            type="text" 
                            id={field.name} 
                            name={field.name} 
                            required={field.required}
                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        />
                    );
                    break;
                case "boolean":
                    inputElement = (
                        <input 
                            type="checkbox" 
                            id={field.name} 
                            name={field.name} 
                            checked={formData[field.name] || false}
                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
                        />
                    );
                    break;
                case "integer":
                    inputElement = (
                        <input 
                            type="number" 
                            id={field.name} 
                            name={field.name} 
                            required={field.required}
                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        />
                    );
                    break;
                case "date":
                    inputElement = (
                        <input 
                            type="date" 
                            id={field.name} 
                            name={field.name} 
                            required={field.required}
                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        />
                    );
                    break;
                case "dateTime":
                    inputElement = (
                        <input 
                            type="datetime-local" 
                            id={field.name} 
                            name={field.name} 
                            required={field.required}
                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        />
                    );
                    break;
                default:
                    inputElement = (
                        <input 
                            type="text" 
                            id={field.name} 
                            name={field.name} 
                            required={field.required}
                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        />
                    );
                    break;
            }
    
            return (
                <div key={index}>
                    <label htmlFor={field.name}>{field.label}</label>
                    {inputElement}
                </div>
            );
        });
    }

    return (
        <div>
            <h2>FHIR Editor</h2>
            <form>{renderFormInputs()}</form>
        </div>
    );
}




export default FHIREditor;
