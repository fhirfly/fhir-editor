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
    const [selectedResource, setSelectedResource] = useState('Patient');

    const uniqueResources = getUniqueResourceNames(structureDefinitionData);

    useEffect(() => {
        const parsedFields = parseStructureDefinitions(structureDefinitionData, selectedResource);
        setFields(parsedFields);
    }, [selectedResource]);
    function renderFormInputs() {
        return fields.map((field, index) => {
            const isMultiple = field.max === 'unbounded' || (typeof field.max === 'number' && field.max > 1);
    
            const handleAdd = () => {
                setFormData(prevData => ({
                    ...prevData,
                    [field.name]: [...(prevData[field.name] || []), '']
                }));
            };
    
            const handleRemove = (idx) => {
                setFormData(prevData => ({
                    ...prevData,
                    [field.name]: prevData[field.name].filter((_, itemIndex) => itemIndex !== idx)
                }));
            };
    
            const handleInputChange = (event, idx) => {
                const newValue = event.target.value;
                setFormData(prevData => {
                    const updatedValues = [...(prevData[field.name] || [])];
                    updatedValues[idx] = newValue;
                    return { ...prevData, [field.name]: updatedValues };
                });
            };
    
            let inputElement;
            if (isMultiple) {
                inputElement = (formData[field.name] || []).map((value, idx) => (
                    <div key={idx}>
                        <input 
                            type="text"
                            value={value}
                            onChange={(e) => handleInputChange(e, idx)}
                            required={field.required}
                        />
                        <button type="button" onClick={() => handleRemove(idx)}>Remove</button>
                    </div>
                ));
                inputElement.push(<button type="button" key="add" onClick={handleAdd}>Add</button>);
            } else {
                inputElement = (
                    <input 
                        type="text" 
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        required={field.required}
                    />
                );
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
                    <option key={resource} value={resource} selected={resource === "Patient"}>{resource}</option>
                ))}
            </select>


            <form>{renderFormInputs()}</form>
        </div>
    );
}

export default FHIREditor;
