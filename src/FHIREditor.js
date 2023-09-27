import React, { useState, useEffect } from 'react';
import structureDefinitionData from './r4b/profiles-resources';
import styles from './FHIREditor.module.css';  // Import the CSS module

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
        <div className={styles.editorContainer}>
        <h2 className={styles.title}>FHIR Editor</h2>

        <select 
            value={selectedResource} 
            onChange={(e) => setSelectedResource(e.target.value)}
            className={styles.resourceDropdown}
        >
            <option value="">Select a Resource</option>
            {uniqueResources.map(resource => (
                <option key={resource} value={resource}>{resource}</option>
            ))}
        </select>

        <form>
        {fields.map((field, index) => (
            <div key={index} className={styles.formField}>
                <label htmlFor={field.name} className={styles.formLabel}>{field.label}</label>
                {(() => {
                    switch (field.dataType) {
                        case "string":
                            return (
                                <input 
                                    type="text" 
                                    id={field.name} 
                                    name={field.name} 
                                    required={field.required}
                                    className={styles.formInput}
                                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                />
                            );
                        case "boolean":
                            return (
                                <select 
                                    id={field.name} 
                                    name={field.name}
                                    required={field.required}
                                    className={styles.formInput}
                                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                >
                                    <option value="">Select an option</option>
                                    <option value="true">True</option>
                                    <option value="false">False</option>
                                </select>
                            );
                        case "integer":
                            return (
                                <input 
                                    type="number" 
                                    id={field.name} 
                                    name={field.name} 
                                    required={field.required}
                                    className={styles.formInput}
                                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                />
                            );
                        // ... Add cases for other data types as needed
                        default:
                            return <input type="text" id={field.name} name={field.name} className={styles.formInput} />;
                    }
                })()}
            </div>
        ))}
    </form>
    </div>
    );
}

export default FHIREditor;
