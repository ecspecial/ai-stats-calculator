const { MongoClient } = require('mongodb');

// MongoDB URI
const uri = "mongodb://admin:123QWEasdf@127.0.0.1:27017/maxartai";

// Create a new MongoClient
const client = new MongoClient(uri);

async function main() {
    try {
        // Connect the client to the server
        await client.connect();
        console.log("Connected successfully to server");

        const database = client.db("maxartai");
        const users = database.collection("users");
        const images = database.collection("images");

        // Task 1: Count total users
        const totalUsers = await users.countDocuments();
        console.log(`Общее количество юзеров: ${totalUsers}`);

        // Task 2: Count users per day
        console.log("Количество юзеров по дням:");
        const startDate = new Date("2024-05-16T14:50:06.306Z");
        const endDate = new Date();  // Use the current date, or set a specific end date
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const startOfDay = new Date(d);
            const endOfDay = new Date(d);
            endOfDay.setDate(d.getDate() + 1);

            const query = { createdAt: { $gte: startOfDay, $lt: endOfDay } };
            const dailyUsers = await users.countDocuments(query);
            const googleUsers = await users.countDocuments({ ...query, authMethod: 'google' });
            const emailUsers = await users.countDocuments({ ...query, authMethod: 'email' });
            const verifiedEmailUsers = await users.countDocuments({ ...query, authMethod: 'email', emailVerified: true });
            const nonVerifiedEmailUsers = await users.countDocuments({ ...query, authMethod: 'email', emailVerified: false });

            console.log(`Дата: ${startOfDay.toISOString().split('T')[0]} - Регистрации: ${dailyUsers}, Google: ${googleUsers}, Email: ${emailUsers} (Подтвержден: ${verifiedEmailUsers}, Не подтвержден: ${nonVerifiedEmailUsers})`);
        }

        // Task 3: Users registered via ref link
        const refUsers = await users.countDocuments({ referredBy: { $ne: null } });
        console.log(`Количество юзеров, зарегистрированных по реферальной ссылке: ${refUsers}`);

        // Task 4: Total amount of generations
        const totalGenerations = await images.countDocuments();
        console.log(`Общее количество генераций: ${totalGenerations}`);

        // Task 5: Generations per day
        console.log("Количество генераций по дням:");
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const startOfDay = new Date(d);
            const endOfDay = new Date(d);
            endOfDay.setDate(d.getDate() + 1);

            const dailyGenerations = await images.countDocuments({ createdAt: { $gte: startOfDay, $lt: endOfDay } });
            const userCountUpToEndOfDay = await users.countDocuments({ createdAt: { $lt: endOfDay } });
            const avgGenerationsPerUser = userCountUpToEndOfDay > 0 ? (dailyGenerations / userCountUpToEndOfDay).toFixed(2) : 0;

            console.log(`Дата: ${startOfDay.toISOString().split('T')[0]} - Генерации: ${dailyGenerations}, Среднее на пользователя: ${avgGenerationsPerUser}`);
        }

        // Task 6: Average amount of generations per user
        const avgGenerationsPerUser = totalGenerations / totalUsers;
        console.log(`Среднее количество генераций на пользователя: ${avgGenerationsPerUser.toFixed(2)}`);

        // Task 8: Average user feedback rating
        const feedbackRatings = await users.aggregate([
            { $match: { feedbackRating: { $ne: null } } },
            { $group: { _id: null, averageRating: { $avg: "$feedbackRating" }, count: { $sum: 1 } } }
        ]).toArray();

        if (feedbackRatings.length > 0) {
            console.log(`Средняя оценка пользователей: ${feedbackRatings[0].averageRating.toFixed(2)} (на основе ${feedbackRatings[0].count} отзывов)`);
        } else {
            console.log("Средняя оценка пользователей: Нет данных");
        }

    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

main().catch(console.error);