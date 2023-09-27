import React, { useState, useEffect } from 'react';
import structureDefinitionData from './r4b/profiles-resources';

function getUniqueResourceNames(data) {
    const resourceNames = new Set();
    if (data && data.entry) {
        data.entry.forEach(entry => {
            if (entry.resource && entry.resource.resourceType === 'StructureDefinition' && entry.resource.name) {
                resourceNames.add(entry.resource.name);
            }
        });
    }
    return [...resourceNames];
}

function parseStructureDefinitions(data, selectedResource) {
    if (!data || !data.entry) {
        return [];
    }

    const structureDefinitions = data.entry
        .filter(entry => 
            entry.resource && 
            entry.resource.resourceType === 'StructureDefinition' &&
            (!selectedResource || entry.resource.name === selectedResource)
        )
        .map(entry => entry.resource);

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
    const [formData, setFormData] = useState({});
    const [fields, setFields] = useState([]);
    const [selectedResource, setSelectedResource] = useState('');
    const uniqueResources = getUniqueResourceNames(structureDefinitionData);

    useEffect(() => {
        const parsedFields = parseStructureDefinitions(structureDefinitionData, selectedResource);
        setFields(parsedFields);
    }, [selectedResource]);
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

            <select value={selectedResource} onChange={(e) => setSelectedResource(e.target.value)}>
                <option value="">Select a Resource</option>
                {uniqueResources.map(resource => (
                    <option key={resource} value={resource}>{resource}</option>
                ))}
            </select>

            <form>{renderFormInputs()}</form>
        </div>
    );
}

export default FHIREditor;
