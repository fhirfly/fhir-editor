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
    console.log("look up value")
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

// Function to convert camelCase to standard label
function camelCaseToLabel(fieldName) {
    const result = fieldName
        .replace(/([A-Z])/g, ' $1')  // Insert space before each uppercase letter
        .replace(/^./, (str) => str.toUpperCase()); // Convert first character to uppercase

    return result.trim(); // Remove any extra spaces at the beginning or end
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
                console.log(element)
                const fieldName = element.path.split('.').pop();
                const label = camelCaseToLabel(fieldName)
                const short = element.short
                const isRequired = element.min > 0;
                const dataTypeCode = element.type && element.type.length > 0 ? element.type[0].code : undefined;

                fields.push({
                    name: fieldName,
                    label: label,
                    dataType: dataTypeCode,
                    required: isRequired,
                    description: short
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
                <label 
                    htmlFor={field.name} 
                    className={`${styles.formLabel} ${field.required ? styles.requiredLabel : ''}`}
                >
                    {field.label} {field.required && '*'}
                </label>
                {(() => {

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
                    console.log(field.dataType)
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
                            case "HumanName":
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
                                case "Address":
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
                                
                                    case "Identifier":
                                        return (
                                            <div>
                                                <select 
                                                    id={`${field.name}.use`} 
                                                    onChange={(e) => setFormData({ ...formData, [`${field.name}.use`]: e.target.value })}
                                                >
                                                    <option value="usual">Usual</option>
                                                    <option value="official">Official</option>
                                                    <option value="temp">Temporary</option>
                                                    <option value="secondary">Secondary</option>
                                                    {/* Add other options as needed */}
                                                </select>
                                                <input 
                                                    type="text" 
                                                    placeholder="Type of Identifier (e.g., MRN)" 
                                                    id={`${field.name}.type`} 
                                                    onChange={(e) => setFormData({ ...formData, [`${field.name}.type`]: e.target.value })}
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="System (e.g., http://hospital.example.org)" 
                                                    id={`${field.name}.system`} 
                                                    onChange={(e) => setFormData({ ...formData, [`${field.name}.system`]: e.target.value })}
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="Value (e.g., 123456)" 
                                                    id={`${field.name}.value`} 
                                                    onChange={(e) => setFormData({ ...formData, [`${field.name}.value`]: e.target.value })}
                                                />
                                            </div>
                                        );
                                        case "Period":
                                            return (
                                                <div>
                                                    <input 
                                                        type="date" 
                                                        placeholder="Start Date" 
                                                        id={`${field.name}.start`} 
                                                        title="The start of the period."
                                                        onChange={(e) => setFormData({ ...formData, [`${field.name}.start`]: e.target.value })}
                                                    />
                                                    <input 
                                                        type="date" 
                                                        placeholder="End Date" 
                                                        id={`${field.name}.end`} 
                                                        title="The end of the period."
                                                        onChange={(e) => setFormData({ ...formData, [`${field.name}.end`]: e.target.value })}
                                                    />
                                                </div>
                                            );
                                        case "ContactPoint":
                                            return (
                                                <div>
                                                    <select 
                                                        id={`${field.name}.system`} 
                                                        title="The communication system (e.g., phone, email)."
                                                        onChange={(e) => setFormData({ ...formData, [`${field.name}.system`]: e.target.value })}
                                                    >
                                                        <option value="phone">Phone</option>
                                                        <option value="email">Email</option>
                                                        <option value="fax">Fax</option>
                                                        <option value="pager">Pager</option>
                                                        <option value="url">URL</option>
                                                        <option value="sms">SMS</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Contact detail (e.g., +1-800-123-4567)" 
                                                        id={`${field.name}.value`} 
                                                        title="The actual contact detail (e.g., phone number or email address)."
                                                        onChange={(e) => setFormData({ ...formData, [`${field.name}.value`]: e.target.value })}
                                                    />
                                                    <select 
                                                        id={`${field.name}.use`} 
                                                        title="The purpose of this contact point (e.g., home, work)."
                                                        onChange={(e) => setFormData({ ...formData, [`${field.name}.use`]: e.target.value })}
                                                    >
                                                        <option value="home">Home</option>
                                                        <option value="work">Work</option>
                                                        <option value="temp">Temporary</option>
                                                        <option value="old">Old/Incorrect</option>
                                                        <option value="mobile">Mobile</option>
                                                    </select>
                                                    <input 
                                                        type="number" 
                                                        placeholder="Rank (e.g., 1)" 
                                                        id={`${field.name}.rank`} 
                                                        title="Specifies a preferred order in which to use this contact. Lower ranks are more preferred."
                                                        onChange={(e) => setFormData({ ...formData, [`${field.name}.rank`]: e.target.value })}
                                                    />
                                                </div>
                                            );
                                                                
                            case 'date':
                            case 'dateTime':
                                return <input type="date" className={styles.formInput} />;
                            case 'string':
                            case 'code':
                                console.log(field)
                                //console.log(field.binding.valueSet)
                                if (field.binding && field.binding.valueSet) {
                                    const codes = findCodesForValueSet(field.binding.valueSet);
                                    console.log(codes)
                                    return (
                                        <select id={field.name} name={field.name} className={styles.formInput}>
                                            {codes.map(code => <option key={code} value={code}>{code}</option>)}
                                        </select>
                                    );
                                }
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
                                if (field.binding && field.binding.valueSet) {
                                    const codes = findCodesForValueSet(field.binding.valueSet);
                                    console.log(codes)
                                    return (
                                        <select id={field.name} name={field.name} className={styles.formInput}>
                                            {codes.map(code => <option key={code} value={code}>{code}</option>)}
                                        </select>
                                    );
                                }
                            case 'Coding':
                                if (field.binding && field.binding.valueSet) {
                                    const codes = findCodesForValueSet(field.binding.valueSet);
                                    console.log(codes)
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
        
        <button type="button" onClick={handleCreateResource}>Create Resource</button>

    </form>
    </div>
    );
}

export default FHIREditor;