import React, { useState, useEffect } from 'react';
import structureDefinitionData from './r4b/profiles-resources';
import v2Tables from './r4b/v2-tables.json';
import valuesets from './r4b/v3-codesystems.json';
import v3Codesystems from './r4b/v3-codesystems.json';
import styles from './FHIREditor.module.css';  // Import the CSS module


// Combine the entries from all three files into a single array
const allValueSets = [...valuesets.entry, ...v3Codesystems.entry, ...v2Tables.entry];

// 2. Helper function to find codes for a given valueSet URL
function findCodesForValueSet(valueSetURL) {
    for (let entry of allValueSets) {
        if (entry.resource && entry.resource.url === valueSetURL) {
            return entry.resource.concept.map(concept => concept.code);
        }
    }
    return [];  // Return an empty array if no matching value set is found
}
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

    function handleCreateResource() {
        // Start with the basic resourceType
        const resource = {
            resourceType: selectedResource
        };
    
        // Loop through the fields to structure the FHIR resource
        fields.forEach(field => {
            if (formData[field.name]) {  // If there's data for this field
                if (field.max === 'unbounded' || field.max === '*' || (typeof field.max === 'number' && field.max > 1)) {
                    // Handle fields that allow multiple values
                    resource[field.name] = formData[field.name];
                } else {
                    // Handle single value fields
                    resource[field.name] = formData[field.name][0] || formData[field.name];
                }
            }
        });
    
        // TODO: Handle nested fields and other complex structures if needed
    
        // TODO: Add logic to send the resource to a server or process it further
        console.log(resource);  // For now, we'll just log it to the console.
    }
    

    function renderFormInputs() {
        return fields.map((field, index) => {
            console.log("renderFormInputs is being called");
            console.log("Fields:", fields);
            const isMultiple = field.max === 'unbounded' || field.max === '*' || (typeof field.max === 'number' && field.max > 1);
    
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
    
            {fields.map((field, index) => (
                <div key={index} className={styles.formField}>
                    <label 
                        htmlFor={field.name} 
                        className={`${styles.formLabel} ${field.required ? styles.requiredLabel : ''}`}
                    >
                        {field.label} {field.required && '*'}
                    </label>
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
                                case "date":
                                    return (
                                        <input 
                                            type="date" 
                                            id={field.name} 
                                            name={field.name} 
                                            required={field.required}
                                            className={styles.formInput}
                                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                        />
                                    );
                                case "name":
                                    return (
                                        <div>
                                            <select 
                                                id={`${field.name}.use`} 
                                                onChange={(e) => setFormData({ ...formData, [`${field.name}.use`]: e.target.value })}
                                            >
                                                <option value="official">Official</option>
                                                <option value="usual">Usual</option>
                                                <option value="old">Old</option>
                                                // Add other options as needed
                                            </select>
                                            <input 
                                                type="text" 
                                                placeholder="Full name" 
                                                id={`${field.name}.text`} 
                                                onChange={(e) => setFormData({ ...formData, [`${field.name}.text`]: e.target.value })}
                                            />
                                            <input 
                                                type="text" 
                                                placeholder="Family name" 
                                                id={`${field.name}.family`} 
                                                onChange={(e) => setFormData({ ...formData, [`${field.name}.family`]: e.target.value })}
                                            />
                                            <input 
                                                type="text" 
                                                placeholder="Given name" 
                                                id={`${field.name}.given`} 
                                                onChange={(e) => setFormData({ ...formData, [`${field.name}.given`]: e.target.value })}
                                            />
                                            // Add more inputs for additional given names, prefixes, suffixes, etc.
                                        </div>
                                    );
                                    case "address":
                                        return (
                                            <div>
                                                <select 
                                                    id={`${field.name}.use`} 
                                                    onChange={(e) => setFormData({ ...formData, [`${field.name}.use`]: e.target.value })}
                                                >
                                                    <option value="home">Home</option>
                                                    <option value="work">Work</option>
                                                    <option value="temp">Temporary</option>
                                                    {/* Add other options as needed */}
                                                </select>
                                                <input 
                                                    type="text" 
                                                    placeholder="Full address" 
                                                    id={`${field.name}.text`} 
                                                    onChange={(e) => setFormData({ ...formData, [`${field.name}.text`]: e.target.value })}
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="Line 1" 
                                                    id={`${field.name}.line[0]`} 
                                                    onChange={(e) => setFormData({ ...formData, [`${field.name}.line[0]`]: e.target.value })}
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="Line 2" 
                                                    id={`${field.name}.line[1]`} 
                                                    onChange={(e) => setFormData({ ...formData, [`${field.name}.line[1]`]: e.target.value })}
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="City" 
                                                    id={`${field.name}.city`} 
                                                    onChange={(e) => setFormData({ ...formData, [`${field.name}.city`]: e.target.value })}
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="State" 
                                                    id={`${field.name}.state`} 
                                                    onChange={(e) => setFormData({ ...formData, [`${field.name}.state`]: e.target.value })}
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="Postal Code" 
                                                    id={`${field.name}.postalCode`} 
                                                    onChange={(e) => setFormData({ ...formData, [`${field.name}.postalCode`]: e.target.value })}
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="Country" 
                                                    id={`${field.name}.country`} 
                                                    onChange={(e) => setFormData({ ...formData, [`${field.name}.country`]: e.target.value })}
                                                />
                                            </div>
                                        );
                                    
                            
                                case 'date':
                                case 'dateTime':
                                    return <input type="date" className={styles.formInput} />;
                                case 'string':
                                case 'code':
                                case 'id':
                                case 'markdown':
                                    return <input type="text" id={field.name} name={field.name} className={styles.formInput} />;
                                case 'boolean':
                                    return <input type="checkbox" id={field.name} name={field.name} className={styles.formInput} />;
                                case 'integer':
                                case 'positiveInt':
                                case 'unsignedInt':
                                case 'integer64':
                                case 'decimal':
                                    return <input type="number" id={field.name} name={field.name} className={styles.formInput} />;
                                case 'CodeableConcept':
                                case 'Coding':
                                    if (field.binding && field.binding.valueSet) {
                                        const codes = findCodesForValueSet(field.binding.valueSet);
                                        return (
                                            <select id={field.name} name={field.name} className={styles.formInput}>
                                            {codes.map(code => <option key={code} value={code}>{code}</option>)}
                                        </select>
                                    );
                                }
                        default:    
                                return <input type="text" id={field.name} name={field.name} className={styles.formInput} />;
                        }
                    })()}
                </div>
            ))}
        });
    }
    
    
    console.log("ParentComponent rendering");
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
        {renderFormInputs()}
        <form>
        
        <button type="button" onClick={handleCreateResource}>Create Resource</button>

    </form>
    </div>
    );
}

export default FHIREditor;