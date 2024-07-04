# Activity

## Overview

In Tailor, the repository structure is defined using activities. 

But what is an activity? An activity is a high-level concept that is 
the building block of the content structure. It is used to group lower 
level content blocks like Content Elements. Activities can be nested, 
meaning that one Activity can contain other Activities within it. This 
feature enables the creation of a layered content structure, 
where broader topics can be broken down into more detailed subtopics,
each represented by its own activity.

## Activity Types

Each activity is assigned a specific type, which serves to define its purpose 
and role within the overall content structure. The type of an activity assigns 
a meaning to it, guiding both the content creator in structuring the material 
and the consumer in navigating through the content.

## Example: Textbook Repository

It might be helpful to explain Activities using a simple example. Let's 
imagine a repository that implements the 'Textbook' schema, with the goal 
of mimicking a textbook structure.

Activities can take many forms (and we will touch upon some of them in future 
topics), but the basic idea is that they represent something the student 
needs to do or achieve. A unit of work if you would.

In this context, a "chapter" is an example of an activity. Each chapter, or 
activity, is designed to encapsulate a coherent collection of content aimed at
facilitating a specific learning outcome or objective. This modular approach 
allows for a flexible and scalable structure, accommodating diverse educational
materials and methodologies.

As mentioned earlier, there can be multiple types of activities in a structure. 
From the perspective of work the student needs to do, a chapter represents a 
collection of content the student needs to go through to gain some knowledge.

But what if chapters were broken down into sections? How would we handle that? 
As it turns out, rather simply. Like we previously defined that a textbook 
(repository) has chapters (activities), we can define that a chapter (activity) 
has sections (activities). Tailor allows that a repository structure can have 
multiple levels of activities where one activity (child) can belong to another 
(parent). The only other difference is that now sections would contain the 
content instead of the chapters. This means that chapters are used only to 
group sections together.
