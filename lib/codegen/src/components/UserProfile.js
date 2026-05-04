To create a functional component named `UserProfile` using Loom JS and Appwrite's Pink design system, we follow these steps:

1. **Install Loom and Appwrite Pink Design System**: Ensure you have both Loom and the Appwrite Pink design system installed in your project.
2. **Import Required Components**: Import necessary components from the Pink design system such as `Avatar`, `Button`, and `Card`.
3. **Create State for User Information**: Use React’s state management to handle user information and allow editing.
4. **Render the Component**: Display the user’s avatar, name, email, and provide buttons for editing.

Here’s a sample implementation of the `UserProfile` functional component:

```jsx
import React, { useState } from 'react';
import { Avatar, Button, Card } from '@appwrite/pink';

const UserProfile = ({ user }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
    };

    const handleSave = () => {
        // Save the user information (This should include API call to save the data)
        console.log("User Information Saved:", { name, email });
        handleEditToggle();
    };

    return (
        <Card>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Avatar image={user.avatarUrl} alt={user.name} />
                <div style={{ marginLeft: '20px' }}>
                    {isEditing ? (
                        <>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </>
                    ) : (
                        <>
                            <h3>{name}</h3>
                            <p>{email}</p>
                        </>
                    )}
                </div>
            </div>
            <Button onClick={isEditing ? handleSave : handleEditToggle}>
                {isEditing ? 'Save' : 'Edit'}
            </Button>
        </Card>
    );
};

export default UserProfile;
```

### Explanation:

- **Imports**: The essential components (`Avatar`, `Button`, `Card`) are imported from the Appwrite Pink design system.
- **State Management**: Two state variables `name` and `email` are initialized based on the user prop passed to the component.
- **Edit Toggle**: The `isEditing` state determines if the fields are editable or just display mode. 
- **Input Handling**: When in edit mode, we display input fields for the user’s name and email, allowing them to change the values.
- **Save Functionality**: The `handleSave` function is where you would typically trigger an API request to save the edited user information.
- **Render Logic**: The component renders user information conditionally based on the editing state.

Make sure to integrate proper user handling and state management according to your application's architecture!